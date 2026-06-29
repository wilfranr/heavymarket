import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const leerTemplate = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8');

const obtenerSelectores = (template: string): string[] => template.match(/<p-(?:select|multiSelect)\b[\s\S]*?(?:<\/p-(?:select|multiSelect)>|\/>)/g) ?? [];

test.describe('Filtro de Marca y Fabricante por nombre visible', () => {
    test('los selectores unificados no buscan dentro de definición o descripción', () => {
        const templates = [
            'src/app/features/referencias/list/list.html',
            'src/app/features/referencias/create/create.html',
            'src/app/features/referencias/edit/edit.html',
            'src/app/shared/components/referencia-create-modal/referencia-create-modal.component.html',
            'src/app/shared/components/referencia-edit-modal/referencia-edit-modal.component.html',
            'src/app/features/articulos/create/create.html',
            'src/app/features/articulos/edit/edit.html',
            'src/app/features/maquinas/create/create.html',
            'src/app/features/maquinas/edit/edit.html',
            'src/app/shared/components/maquina-create-modal/maquina-create-modal.component.html',
            'src/app/features/pedidos/costeo/costeo.html'
        ];

        for (const ruta of templates) {
            const selectoresMarca = obtenerSelectores(leerTemplate(ruta)).filter((selector) => /\[options\]="(?:marcas(?:Referencias|YFabricantes)?(?:\(\))?|fabricantes(?:\(\))?)"/.test(selector));

            expect(selectoresMarca.length, `${ruta} debe contener al menos un selector de Marca o Fabricante`).toBeGreaterThan(0);
            for (const selector of selectoresMarca) {
                expect(selector, `${ruta} debe filtrar por nombre o label`).toMatch(/filterBy="(?:nombre|label)"/);
                expect(selector, `${ruta} no debe filtrar por textos relacionados`).not.toMatch(/filterBy="[^"]*(?:definicion|descripcion)/);
            }
        }
    });

    test('los formularios de pedidos filtran la máquina por su label visible', () => {
        const templates = ['src/app/features/pedidos/create/create.html', 'src/app/features/pedidos/edit/edit.html'];

        for (const ruta of templates) {
            const selectorMaquina = obtenerSelectores(leerTemplate(ruta)).find((selector) => selector.includes('formControlName="maquina_id"'));

            expect(selectorMaquina, `${ruta} debe contener el selector de máquina`).toBeDefined();
            expect(selectorMaquina).toContain('optionLabel="label"');
            expect(selectorMaquina).toContain('filterBy="label"');
            expect(selectorMaquina).not.toMatch(/filterBy="[^"]*(?:definicion|descripcion)/);
        }
    });

    test('los formularios de listas limitan sus filtros locales al label', () => {
        const templates = ['src/app/features/listas/create/create.html', 'src/app/features/listas/edit/edit.html', 'src/app/shared/components/lista-create-modal/lista-create-modal.component.html'];

        for (const ruta of templates) {
            const selectoresFiltrables = obtenerSelectores(leerTemplate(ruta)).filter((selector) => selector.includes('[filter]="true"'));

            expect(selectoresFiltrables.length, `${ruta} debe contener selectores filtrables`).toBeGreaterThan(0);
            for (const selector of selectoresFiltrables) {
                expect(selector, `${ruta} debe declarar el label como único campo de filtro`).toContain('filterBy="label"');
                expect(selector).not.toMatch(/filterBy="[^"]*(?:definicion|descripcion)/);
            }
        }
    });
});
