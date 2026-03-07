import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { Output, EventEmitter } from '@angular/core';

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

@Component({
    selector: 'app-cookies-banner',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, ToggleSwitchModule, FormsModule],
    templateUrl: './cookies-banner.component.html',
    styles: [`
        .cookies-banner-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            z-index: 9999;
            box-shadow: 0 -4px 10px rgba(0,0,0,0.1);
        }
    `]
})
export class CookiesBannerComponent implements OnInit {
    showBanner = false;
    showPreferences = false;

    @Output() openTerms = new EventEmitter<void>();

    preferences: CookiePreferences = {
        necessary: true,
        analytics: true,
        marketing: true
    };

    private storageKey = 'heavymarket_cookie_consent';

    ngOnInit() {
        this.checkConsent();
    }

    checkConsent() {
        const storedConsent = localStorage.getItem(this.storageKey);
        if (!storedConsent) {
            this.showBanner = true;
        } else {
            try {
                this.preferences = JSON.parse(storedConsent);
            } catch (e) {
                this.showBanner = true;
            }
        }
    }

    acceptAll() {
        this.preferences = {
            necessary: true,
            analytics: true,
            marketing: true
        };
        this.savePreferences();
    }

    rejectAll() {
        this.preferences = {
            necessary: true,
            analytics: false,
            marketing: false
        };
        this.savePreferences();
    }

    savePreferences() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
        this.showBanner = false;
        this.showPreferences = false;
        this.applyCookiesLogic();
    }

    openPreferences() {
        this.showPreferences = true;
    }

    closePreferences() {
        this.showPreferences = false;
    }

    applyCookiesLogic() {
        // Here you would trigger analytics/marketing scripts based on preferences
        if (this.preferences.analytics) {
            // Load Google Analytics, etc.
        }
        if (this.preferences.marketing) {
            // Load Meta/Marketing Pixels, etc.
        }
    }

    onTermsClick() {
        this.openTerms.emit();
    }
}
