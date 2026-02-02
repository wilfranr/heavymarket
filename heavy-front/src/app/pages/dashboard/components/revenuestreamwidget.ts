import { Component, OnInit, inject } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-revenue-stream-widget',
    imports: [ChartModule],
    template: `<div class="card mb-8!">
        <div class="font-semibold text-xl mb-4">Revenue Stream</div>
        <p-chart type="bar" [data]="chartData" [options]="chartOptions" class="h-100" />
    </div>`
})
export class RevenueStreamWidget implements OnInit {
    private readonly dashboardService = inject(DashboardService);

    chartData: any;

    chartOptions: any;

    subscription!: Subscription;

    constructor(public layoutService: LayoutService) {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            this.initChart();
        });
    }

    ngOnInit() {
        this.initChart();
    }

    initChart() {
        // Fetch real data
        this.dashboardService.getRevenueStream().subscribe(data => {
            const documentStyle = getComputedStyle(document.documentElement);
            const textColor = documentStyle.getPropertyValue('--text-color');
            const borderColor = documentStyle.getPropertyValue('--surface-border');
            const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

            this.chartData = {
                labels: data.labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Ingresos',
                        backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                        data: data.data,
                        barThickness: 32
                    }
                ]
            };

            this.chartOptions = {
                maintainAspectRatio: false,
                aspectRatio: 0.8,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textMutedColor
                        },
                        grid: {
                            color: 'transparent',
                            borderColor: 'transparent'
                        }
                    },
                    y: {
                        ticks: {
                            color: textMutedColor
                        },
                        grid: {
                            color: borderColor,
                            borderColor: 'transparent',
                            drawTicks: false
                        }
                    }
                }
            };
        });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
