import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';
import { AuthService } from '../auth/services/auth.service';
import { ToastService } from './toast.service';
import { signal } from '@angular/core';

describe('NotificationService', () => {
    let service: NotificationService;
    let httpMock: HttpTestingController;
    const currentUserSignal = signal<{ id: number; name: string } | null>({ id: 1, name: 'Test User' });

    beforeEach(() => {
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
        authServiceSpy.currentUser = currentUserSignal;
        authServiceSpy.getToken.and.returnValue('mock-token');

        const toastServiceSpy = jasmine.createSpyObj('ToastService', ['info', 'success', 'error', 'warning']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                NotificationService,
                { provide: AuthService, useValue: authServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy }
            ]
        });
        service = TestBed.inject(NotificationService);
        httpMock = TestBed.inject(HttpTestingController);

        // Forzar ejecución de efectos reactivos (loadUnreadCount)
        TestBed.flushEffects();

        const unreadReq = httpMock.expectOne((req) => req.url.includes('/notifications/unread-count'));
        unreadReq.flush({ count: 1 });
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load unread count on init without full list', () => {
        expect(service.unreadCount()).toBe(1);
        expect(service.notifications().length).toBe(0);
    });

    it('should load notifications when ensureNotificationsLoaded is called', () => {
        service.ensureNotificationsLoaded();

        const req = httpMock.expectOne((r) => r.url.includes('/notifications') && !r.url.includes('unread-count'));
        req.flush({
            data: [{ id: '1', title: 'Test 1', message: 'Msg 1', type: 'info', read: false, created_at: new Date().toISOString() }]
        });

        expect(service.notifications().length).toBe(1);
    });

    it('should calculate unread count correctly after load', () => {
        service.ensureNotificationsLoaded();
        const req = httpMock.expectOne((r) => r.url.includes('/notifications') && !r.url.includes('unread-count'));
        req.flush({
            data: [
                { id: '1', title: 'A', message: 'M', type: 'info', read: false, created_at: new Date().toISOString() },
                { id: '2', title: 'B', message: 'M', type: 'info', read: true, created_at: new Date().toISOString() }
            ]
        });

        expect(service.unreadCount()).toBe(1);
    });

    describe('addLocalNotification', () => {
        it('should add new notification', () => {
            const initialCount = service.notifications().length;

            service.addLocalNotification({
                type: 'pedido_creado',
                title: 'Nuevo Pedido',
                message: 'Se creó el pedido #123'
            });

            expect(service.notifications().length).toBe(initialCount + 1);
            expect(service.notifications()[0].title).toBe('Nuevo Pedido');
            expect(service.notifications()[0].read).toBe(false);
        });

        it('should increment unread count', () => {
            const initialUnread = service.unreadCount();

            service.addLocalNotification({
                type: 'sistema',
                title: 'Sistema',
                message: 'Actualización disponible'
            });

            expect(service.unreadCount()).toBe(initialUnread + 1);
        });
    });

    describe('markAsRead', () => {
        beforeEach(() => {
            service.ensureNotificationsLoaded();
            const req = httpMock.expectOne((r) => r.url.includes('/notifications') && !r.url.includes('unread-count'));
            req.flush({
                data: [{ id: '1', title: 'Test', message: 'Msg', type: 'info', read: false, created_at: new Date().toISOString() }]
            });
        });

        it('should mark notification as read', () => {
            const initialUnread = service.unreadCount();
            service.markAsRead('1');

            expect(service.notifications()[0].read).toBe(true);
            expect(service.unreadCount()).toBe(initialUnread - 1);

            const patchReq = httpMock.expectOne((r) => r.url.includes('/notifications/1/read'));
            patchReq.flush({});
        });
    });

    describe('markAllAsRead', () => {
        beforeEach(() => {
            service.ensureNotificationsLoaded();
            const req = httpMock.expectOne((r) => r.url.includes('/notifications') && !r.url.includes('unread-count'));
            req.flush({
                data: [{ id: '1', title: 'Test', message: 'Msg', type: 'info', read: false, created_at: new Date().toISOString() }]
            });
        });

        it('should mark all notifications as read', () => {
            service.markAllAsRead();

            expect(service.notifications().every((n) => n.read)).toBe(true);
            expect(service.unreadCount()).toBe(0);

            const postReq = httpMock.expectOne((r) => r.url.includes('/mark-all-read'));
            postReq.flush({});
        });
    });

    describe('deleteNotification', () => {
        beforeEach(() => {
            service.ensureNotificationsLoaded();
            const req = httpMock.expectOne((r) => r.url.includes('/notifications') && !r.url.includes('unread-count'));
            req.flush({
                data: [{ id: '1', title: 'Test', message: 'Msg', type: 'info', read: false, created_at: new Date().toISOString() }]
            });
        });

        it('should remove notification', () => {
            service.deleteNotification('1');

            expect(service.notifications().length).toBe(0);

            const deleteReq = httpMock.expectOne((r) => r.url.includes('/notifications/1'));
            deleteReq.flush({});
        });
    });

    describe('notification types', () => {
        const types: NotificationType[] = ['pedido_creado', 'pedido_actualizado', 'cotizacion_nueva', 'orden_confirmada', 'tercero_nuevo', 'sistema', 'info'];

        types.forEach((type) => {
            it(`should handle ${type} notification type`, () => {
                service.addLocalNotification({
                    type,
                    title: `Test ${type}`,
                    message: `Testing ${type}`
                });

                const notification = service.notifications()[0];
                expect(notification.type).toBe(type);
                expect(notification.icon).toBeTruthy();
                expect(notification.iconColor).toBeTruthy();
            });
        });
    });
});
