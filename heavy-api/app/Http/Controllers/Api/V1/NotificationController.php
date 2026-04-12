<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List user notifications
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Paginate notifications
        $notifications = $user->notifications()->latest()->paginate(20);

        // Transform structure if needed to match frontend expectation
        // Default database notification structure in Laravel:
        // { id, type, notifiable_type, notifiable_id, data: { ... }, read_at, created_at, updated_at }
        // Frontend expects: { id, type, title, message, icon, iconColor, read, created_at, data }

        $transformed = $notifications->through(function ($n) {
            return [
                'id' => $n->id,
                'type' => $n->data['type'] ?? 'info',
                'title' => $n->data['title'] ?? 'Notificación',
                'message' => $n->data['message'] ?? '',
                'icon' => $n->data['icon'] ?? 'pi-bell',
                'iconColor' => $n->data['iconColor'] ?? 'blue',
                'read' => $n->read_at !== null,
                'created_at' => $n->created_at->toISOString(),
                'data' => $n->data['data'] ?? [],
            ];
        });

        return response()->json($transformed);
    }

    /**
     * Count unread notifications
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark as read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notificación marcada como leída']);
    }

    /**
     * Mark all as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notificación eliminada']);
    }
}
