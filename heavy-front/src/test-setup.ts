import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { vi, expect } from 'vitest';
import { ResourceLoader } from '@angular/compiler';

// Mock ResourceLoader para Vitest
class MockResourceLoader extends ResourceLoader {
    override get(url: string): string | Promise<string> {
        return Promise.resolve('');
    }
}

// Compatibilidad con Jasmine para tests antiguos
(globalThis as any).jasmine = {
    createSpyObj: (name: string, methods: string[]) => {
        const obj: any = {};
        methods.forEach((m) => {
            const spy = vi.fn();
            (spy as any).and = {
                returnValue: (val: any) => spy.mockReturnValue(val),
                callFake: (cb: any) => spy.mockImplementation(cb),
                stub: () => spy
            };
            obj[m] = spy;
        });
        return obj;
    },
    any: (type: any) => expect.any(type)
};
(globalThis as any).spyOn = (obj: any, method: string) => {
    const spy = vi.spyOn(obj, method);
    (spy as any).and = {
        returnValue: (val: any) => spy.mockReturnValue(val),
        callFake: (cb: any) => spy.mockImplementation(cb),
        stub: () => spy
    };
    return spy;
};

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
    providers: [{ provide: ResourceLoader, useClass: MockResourceLoader }]
});
