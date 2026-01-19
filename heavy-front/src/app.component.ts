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
        const yellowPalette = Aura.primitive?.yellow;
        
        if (!yellowPalette) return;
        
        const themeConfig = {
            semantic: {
                primary: yellowPalette,
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
                            color: '{primary.400}',
                            contrastColor: '{surface.900}',
                            hoverColor: '{primary.300}',
                            activeColor: '{primary.200}'
                        },
                        highlight: {
                            background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                            focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
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
