"""
Se ejecuta en GitHub Actions cuando se cierra un issue de heavymarket.
Busca el nodo correspondiente en .harness/dag.json (o dag_archive.json),
y si esta done con client_summary, mueve la tarjeta de Trello asociada
a "In Process" y deja el comentario para el cliente.

No depende de ningun servidor propio: el numero de tarjeta de Trello se
extrae del propio cuerpo del issue (enlace que ya deja el sync Trello->GitHub),
y las credenciales de Trello llegan como secrets del repositorio.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

IN_PROCESS_LIST_ID = "62f9a8565b0e38348d3c35de"
DAG_PATH = ".harness/dag.json"
DAG_ARCHIVE_PATH = ".harness/dag_archive.json"
TRELLO_URL_RE = re.compile(r"https://trello\.com/c/([A-Za-z0-9]+)")


def find_node(issue_number: int):
    if os.path.exists(DAG_PATH):
        with open(DAG_PATH, "r", encoding="utf-8") as f:
            dag = json.load(f)
        for node in dag.get("nodes", []):
            if node.get("github_issue") == issue_number:
                return node

    if os.path.exists(DAG_ARCHIVE_PATH):
        with open(DAG_ARCHIVE_PATH, "r", encoding="utf-8") as f:
            archive = json.load(f)
        for snapshot in archive:
            for node in snapshot.get("nodes", []):
                if node.get("github_issue") == issue_number:
                    return node

    return None


def trello_request(method: str, path: str, api_key: str, token: str, data: dict = None):
    query = urllib.parse.urlencode({"key": api_key, "token": token, **(data or {})})
    url = f"https://api.trello.com/1{path}?{query}"
    request = urllib.request.Request(url, method=method)
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    issue_number = int(os.environ["ISSUE_NUMBER"])
    issue_body = os.environ.get("ISSUE_BODY") or ""
    api_key = os.environ["TRELLO_API_KEY"]
    token = os.environ["TRELLO_TOKEN"]

    node = find_node(issue_number)
    if node is None:
        print(f"[SKIP] Issue #{issue_number}: no corresponde a un nodo del harness.")
        return

    if node.get("status") != "done":
        print(f"[SKIP] Issue #{issue_number}: nodo '{node.get('id')}' no esta done.")
        return

    client_summary = (node.get("client_summary") or "").strip()
    if not client_summary:
        print(f"[SKIP] Issue #{issue_number}: nodo '{node.get('id')}' done pero sin client_summary.")
        return

    match = TRELLO_URL_RE.search(issue_body)
    if not match:
        print(f"[SKIP] Issue #{issue_number}: el cuerpo del issue no tiene link de Trello.")
        return

    short_link = match.group(1)

    try:
        card = trello_request("GET", f"/cards/{short_link}", api_key, token)
        card_id = card["id"]
        trello_request("PUT", f"/cards/{card_id}", api_key, token, {"idList": IN_PROCESS_LIST_ID})
        trello_request("POST", f"/cards/{card_id}/actions/comments", api_key, token, {"text": client_summary})
    except Exception as e:
        print(f"[ERROR] Issue #{issue_number}: fallo al mover/comentar la tarjeta de Trello: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"[OK] Issue #{issue_number} -> tarjeta '{card.get('name')}' movida a In Process.")


if __name__ == "__main__":
    main()
