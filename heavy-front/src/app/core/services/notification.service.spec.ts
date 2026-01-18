import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NotificationService]
        });
        service = TestBed.inject(NotificationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load mock notifications on init', () => {
        const notifications = service.notifications();
        expect(notifications.length).toBeGreaterThan(0);
    });

    it('should calculate unread count correctly', () => {
        const unreadCount = service.unreadCount();
        const notifications = service.notifications();
        const expectedUnread = notifications.filter(n => !n.read).length;
        
        expect(unreadCount).toBe(expectedUnread);
    });

    describe('addNotification', () => {
        it('should add new notification', () => {
            const initialCount = service.notifications().length;
            
            service.addNotification({
                type: 'pedido_creado',
                title: 'Nuevo Pedido',
                message: 'Se creó el pedido #123'
            });

            expect(service.notifications().length).toBe(initialCount + 1);
            expect(service.notifications()[0].title).toBe('Nuevo Pedido');
            expect(service.notifications()[0].read).toBe(false);
        });

        it('should add notification with correct icon and color', () => {
            service.addNotification({
                type: 'orden_confirmada',
                title: 'Orden Confirmada',
                message: 'La orden fue confirmada'
            });

            const notification = service.notifications()[0];
            expect(notification.icon).toBe('pi-check-circle');
            expect(notification.iconColor).toBe('green');
        });

        it('should increment unread count', () => {
            const initialUnread = service.unreadCount();
            
            service.addNotification({
                type: 'sistema',
                title: 'Sistema',
                message: 'Actualización disponible'
            });

            expect(service.unreadCount()).toBe(initialUnread + 1);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', () => {
            const notifications = service.notifications();
            const unreadNotification = notifications.find(n => !n.read);
            
            if (unreadNotification) {
                const initialUnread = service.unreadCount();
                service.markAsRead(unreadNotification.id);
                
                const updatedNotification = service.notifications().find(n => n.id === unreadNotification.id);
                expect(updatedNotification?.read).toBe(true);
                expect(service.unreadCount()).toBe(initialUnread - 1);
            }
        });

        it('should not change unread count if already read', () => {
            const notifications = service.notifications();
            const readNotification = notifications.find(n => n.read);
            
            if (readNotification) {
                const initialUnread = service.unreadCount();
                service.markAsRead(readNotification.id);
                
                expect(service.unreadCount()).toBe(initialUnread);
            }
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', () => {
            service.markAllAsRead();
            
            const notifications = service.notifications();
            const allRead = notifications.every(n => n.read);
            
            expect(allRead).toBe(true);
            expect(service.unreadCount()).toBe(0);
        });
    });

    describe('deleteNotification', () => {
        it('should remove notification', () => {
            const notifications = service.notifications();
            const initialCount = notifications.length;
            const firstNotification = notifications[0];
            
            service.deleteNotification(firstNotification.id);
            
            expect(service.notifications().length).toBe(initialCount - 1);
            expect(service.notifications().find(n => n.id === firstNotification.id)).toBeUndefined();
        });

        it('should update unread count when deleting unread notification', () => {
            const notifications = service.notifications();
            const unreadNotification = notifications.find(n => !n.read);
            
            if (unreadNotification) {
                const initialUnread = service.unreadCount();
                service.deleteNotification(unreadNotification.id);
                
                expect(service.unreadCount()).toBe(initialUnread - 1);
            }
        });
    });

    describe('notification types', () => {
        const types: NotificationType[] = [
            'pedido_creado',
            'pedido_actualizado',
            'cotizacion_nueva',
            'orden_confirmada',
            'tercero_nuevo',
            'sistema',
            'info'
        ];

        types.forEach(type => {
            it(`should handle ${type} notification type`, () => {
                service.addNotification({
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
