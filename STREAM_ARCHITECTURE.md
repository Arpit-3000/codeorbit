# Stream.io Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              StreamProvider (Global)                     │   │
│  │  • Initializes Stream client on mount                   │   │
│  │  • Connects user with token from backend                │   │
│  │  • Sets up notification channel                         │   │
│  │  • Provides: client, notificationChannel, isConnected   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          App Components (useStream hook)                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  CollaborativeCanvas                                     │  │
│  │  ├─ joinRoom('room-123')                                │  │
│  │  ├─ Listen: canvas_draw, canvas_erase, canvas_clear     │  │
│  │  └─ Send: canvas events to room channel                 │  │
│  │                                                           │  │
│  │  VideoCall                                               │  │
│  │  ├─ Uses Stream Video SDK                               │  │
│  │  ├─ Creates video call: call('default', 'room-id')      │  │
│  │  └─ Handles audio/video streams                         │  │
│  │                                                           │  │
│  │  Social Components                                       │  │
│  │  ├─ Listen: notification channel                        │  │
│  │  ├─ Events: friend_request, ping_request, user_online   │  │
│  │  └─ Uses REST API for CRUD operations                   │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲  │
                              │  │
                   ┌──────────┘  └──────────┐
                   │                         │
            JWT Auth Token          Stream Token Request
            (Firebase)              GET /api/stream/token
                   │                         │
                   ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Authentication Middleware                                       │
│  ├─ Verifies Firebase JWT                                       │
│  └─ Extracts user info                                          │
│                    ▼                                             │
│  Stream Token Endpoint                                           │
│  ├─ POST /api/stream/token                                      │
│  ├─ Creates Stream user token                                   │
│  └─ Returns: { token, apiKey, userId }                          │
│                    ▼                                             │
│  REST API Endpoints                                              │
│  ├─ Friend requests (CRUD)                                      │
│  ├─ Ping requests (CRUD)                                        │
│  ├─ Notifications (CRUD)                                        │
│  └─ Room management                                             │
│                    ▼                                             │
│  Stream Integration                                              │
│  ├─ Initialize Stream client                                    │
│  ├─ Send events to notification channels                        │
│  └─ Create/manage Stream channels                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Stream.io Cloud                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Channels                                                        │
│  ├─ notifications-{userId}  (per-user notifications)            │
│  ├─ room-{roomId}          (collaboration rooms)                │
│  └─ video-call-{callId}    (video calls)                        │
│                                                                   │
│  Features                                                        │
│  ├─ Real-time messaging                                         │
│  ├─ Event broadcasting                                          │
│  ├─ Message history/persistence                                 │
│  ├─ User presence tracking                                      │
│  ├─ Typing indicators                                           │
│  └─ Video/Audio streaming                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Event Flow Examples

### 1. Friend Request Flow

```
User A                Frontend A              Backend              Stream.io         Frontend B              User B
  │                       │                       │                    │                  │                    │
  │  Send Request         │                       │                    │                  │                    │
  ├──────────────────────>│                       │                    │                  │                    │
  │                       │  POST /friend-request │                    │                  │                    │
  │                       ├──────────────────────>│                    │                  │                    │
  │                       │                       │ Save to DB         │                  │                    │
  │                       │                       │────────────┐       │                  │                    │
  │                       │                       │            │       │                  │                    │
  │                       │                       │<───────────┘       │                  │                    │
  │                       │                       │                    │                  │                    │
  │                       │                       │ Send Event         │                  │                    │
  │                       │                       │ "friend_request"   │                  │                    │
  │                       │                       ├───────────────────>│                  │                    │
  │                       │                       │                    │ Broadcast Event  │                    │
  │                       │                       │                    │ to User B        │                    │
  │                       │                       │                    ├─────────────────>│                    │
  │                       │                       │                    │                  │ Show Notification  │
  │                       │                       │                    │                  ├───────────────────>│
  │                       │  200 OK               │                    │                  │                    │
  │                       │<──────────────────────│                    │                  │                    │
  │  "Request sent!"      │                       │                    │                  │                    │
  │<──────────────────────│                       │                    │                  │                    │
```

### 2. Canvas Collaboration Flow

```
User A                Frontend A              Stream.io           Frontend B              User B
  │                       │                       │                    │                    │
  │  Draw on Canvas       │                       │                    │                    │
  ├──────────────────────>│                       │                    │                    │
  │                       │ Draw Locally          │                    │                    │
  │                       │───────────┐           │                    │                    │
  │                       │           │           │                    │                    │
  │                       │<──────────┘           │                    │                    │
  │                       │                       │                    │                    │
  │                       │ sendEvent()           │                    │                    │
  │                       │ "canvas_draw"         │                    │                    │
  │                       ├──────────────────────>│                    │                    │
  │                       │                       │ Broadcast to Room  │                    │
  │                       │                       ├───────────────────>│                    │
  │                       │                       │                    │ Draw on Canvas     │
  │                       │                       │                    ├───────────────────>│
  │                       │                       │                    │                    │
```

### 3. Video Call Flow

```
User A                Frontend A              Backend              Stream.io         Frontend B              User B
  │                       │                       │                    │                  │                    │
  │  Start Call           │                       │                    │                  │                    │
  ├──────────────────────>│                       │                    │                  │                    │
  │                       │  Get Stream Token     │                    │                  │                    │
  │                       ├──────────────────────>│                    │                  │                    │
  │                       │<──────────────────────│                    │                  │                    │
  │                       │                       │                    │                  │                    │
  │                       │ VideoClient.call()    │                    │                  │                    │
  │                       ├───────────────────────────────────────────>│                  │                    │
  │                       │                       │                    │                  │                    │
  │                       │ call.join()           │                    │                  │                    │
  │                       ├───────────────────────────────────────────>│                  │                    │
  │                       │                       │                    │ Notify Participant                    │
  │                       │                       │                    ├─────────────────>│                    │
  │                       │                       │                    │                  │ Show Call Invite   │
  │                       │                       │                    │                  ├───────────────────>│
  │  Video Stream         │                       │                    │                  │  Join Call         │
  │<══════════════════════════════════════════════════════════════════════════════════════════════════════════>│
```

## Channel Types

### Notification Channel
- **ID Pattern**: `notifications-{userId}`
- **Purpose**: User-specific notifications
- **Events**:
  - `friend_request_received`
  - `request_accepted`
  - `ping_request`
  - `ping_accepted`
  - `user_online`
  - `user_offline`

### Room Channel
- **ID Pattern**: `room-{roomId}`
- **Purpose**: Collaboration rooms
- **Events**:
  - `message.new` (chat messages)
  - `typing.start` / `typing.stop`
  - `canvas_draw` (custom)
  - `canvas_erase` (custom)
  - `canvas_clear` (custom)

### Video Call
- **ID Pattern**: `default/{roomId}`
- **Purpose**: Audio/video communication
- **Features**:
  - Audio/video streams
  - Screen sharing
  - Participant management
  - Call recording

## Data Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────>│   Backend    │────────>│   Stream.io  │
│              │         │              │         │              │
│ • UI Events  │         │ • Auth       │         │ • Real-time  │
│ • User Input │         │ • Business   │         │ • Broadcasting│
│ • Display    │         │   Logic      │         │ • Persistence│
│              │<────────│ • Database   │<────────│              │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Security Model

```
1. User authenticates with Firebase
2. Frontend gets JWT token
3. Backend verifies JWT token
4. Backend generates Stream user token (specific to user)
5. Frontend uses Stream token to connect
6. Stream validates token on every request
7. Channel-level permissions enforced by Stream
```

## Scalability

- **Stream.io handles**: WebSocket connections, message routing, persistence
- **Backend handles**: Business logic, database operations, authentication
- **Frontend handles**: UI rendering, local state, user interactions

Stream.io automatically scales to handle:
- Millions of concurrent users
- Billions of messages per day
- Global CDN for low latency
- 99.999% uptime SLA

## Key Advantages

✅ **Separation of Concerns**: Real-time logic in Stream, business logic in backend
✅ **Scalability**: Stream handles all WebSocket scaling
✅ **Reliability**: Built-in reconnection, message persistence
✅ **Developer Experience**: Simple API, great TypeScript support
✅ **Features**: Typing indicators, presence, read receipts out-of-the-box
