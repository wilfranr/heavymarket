import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { updatePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { LayoutService } from './app/layout/service/layout.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
    private layoutService = inject(LayoutService);

    ngOnInit() {
        // Aplicar tema amarillo por defecto
        this.applyYellowTheme();
    }

    private applyYellowTheme() {
        const brandPalette = {
            50: '#fff9ea',
            100: '#ffefc9',
            200: '#ffdf8f',
            300: '#ffcf54',
            400: '#ffbf24',
            500: '#fdb831',
            600: '#e49a1d',
            700: '#c07d15',
            800: '#9c6211',
            900: '#7e4e0f',
            950: '#492a06'
        };

        const themeConfig = {
            semantic: {
                primary: brandPalette,
                colorScheme: {
                    light: {
                        primary: {
                            color: '{primary.500}',
                            contrastColor: '#ffffff',
                            hoverColor: '{primary.600}',
                            activeColor: '{primary.700}'
                        },
                        highlight: {
                            background: '{primary.50}',
                            focusBackground: '{primary.100}',
                            color: '{primary.700}',
                            focusColor: '{primary.800}'
                        }
                    },
                    dark: {
                        primary: {
                            color: '{primary.500}',
                            contrastColor: '{surface.900}',
                            hoverColor: '{primary.400}',
                            activeColor: '{primary.300}'
                        },
                        highlight: {
                            background: 'color-mix(in srgb, {primary.500}, transparent 84%)',
                            focusBackground: 'color-mix(in srgb, {primary.500}, transparent 76%)',
                            color: 'rgba(255,255,255,.87)',
                            focusColor: 'rgba(255,255,255,.87)'
                        }
                    }
                }
            }
        };

        updatePreset(themeConfig);
    }
}
