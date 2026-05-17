/**
 * Adjunta sistema_ids al FormData de listas (tipo Tipo de Artículo).
 */
export function appendSistemaIdsToFormData(formData: FormData, sistemaIds: number[] | null | undefined): void {
    if (sistemaIds === null || sistemaIds === undefined) {
        return;
    }

    if (sistemaIds.length === 0) {
        formData.append('sistema_ids_cleared', '1');
        formData.append('sistema_ids', '[]');

        return;
    }

    formData.append('sistema_ids', JSON.stringify(sistemaIds));
}
