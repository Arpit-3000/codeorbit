# Stream.io Quick Reference Guide

## Setup & Usage

### 1. Using Stream Context

```typescript
import { useStream } from '@/contexts/stream-context';

function MyComponent() {
  const { client, notificationChannel, isConnected, joinRoom, leaveRoom } = useStream();
  
  // Check connection status
  if (!isConnected) {
    return <div>Connecting...</div>;
  }
  
  return <div>Connected to Stream!</div>;
}
```

### 2. Joining a Room (Chat/Collaboration)

```typescript
const { joinRoom, leaveRoom } = useStream();
const [roomChannel, setRoomChannel] = useState<Channel | null>(null);

useEffect(() => {
  let channel: Channel | null = null;

  const setup = async () => {
    channel = await joinRoom('room-123');
    if (!channel) return;
    
    setRoomChannel(channel);
    
    // Listen for messages
    channel.on('message.new', (event) => {
      console.log('New message:', event.message);
    });
    
    // Listen for custom events
    channel.on('custom_event', (event) => {
      console.log('Custom event:', event.data);
    });
  };

  setup();

  return () => {
    if (channel) {
      leaveRoom(channel);
    }
  };
}, [joinRoom, leaveRoom]);
```

### 3. Sending Messages

```typescript
// Send a text message
await roomChannel.sendMessage({
  text: 'Hello, world!'
});

// Send with custom data
await roomChannel.sendMessage({
  text: 'Check this out!',
  customData: {
    type: 'code_snippet',
    language: 'javascript',
  }
});
```

### 4. Sending Custom Events

```typescript
// Send custom event (like canvas draw)
await roomChannel.sendEvent({
  type: 'canvas_draw',
  data: {
    stroke: {
      color: '#000000',
      points: [{ x: 10, y: 20 }],
    }
  }
});

// Send typing indicator
await roomChannel.keystroke();
```

### 5. Listening to Events

```typescript
// Listen for new messages
channel.on('message.new', (event: Event) => {
  console.log('Message:', event.message.text);
  console.log('From:', event.user?.name);
});

// Listen for typing
channel.on('typing.start', (event: Event) => {
  console.log(`${event.user?.name} is typing...`);
});

channel.on('typing.stop', (event: Event) => {
  console.log(`${event.user?.name} stopped typing`);
});

// Listen for custom events
channel.on('canvas_draw', (event: Event) => {
  const data = event.data as any;
  handleCanvasDrawing(data.stroke);
});

// Listen for all events (debugging)
channel.on('*', (event: Event) => {
  console.log('Event:', event.type, event);
});
```

### 6. User Presence (Online/Offline)

```typescript
// Already handled by notification channel!
// Online/offline events are automatically sent

// To check user status manually:
const { users } = await client.queryUsers({
  id: { $in: ['user1', 'user2', 'user3'] }
});

users.forEach(user => {
  console.log(`${user.name} is ${user.online ? 'online' : 'offline'}`);
});
```

### 7. Getting Message History

```typescript
const channel = await joinRoom('room-123');

// Get latest messages (already loaded with watch())
const messages = channel.state.messages;

// Load older messages
const response = await channel.query({
  messages: { limit: 50, offset: 0 }
});

console.log('Messages:', response.messages);
```

## Common Patterns

### Pattern 1: Real-time Notifications

```typescript
// Already setup in stream-context.tsx!
// Notification channel listens for:
// - friend_request_received
// - request_accepted
// - ping_request
// - ping_accepted
// - user_online
// - user_offline

// To send notification from backend:
// POST to Stream channel: notifications-${userId}
```

### Pattern 2: Collaborative Canvas

```typescript
const CollaborativeCanvas = ({ roomId }) => {
  const { joinRoom } = useStream();
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    const setup = async () => {
      const ch = await joinRoom(roomId);
      setChannel(ch);
      
      ch.on('canvas_draw', (event) => {
        drawStroke(event.data.stroke);
      });
      
      ch.on('canvas_clear', () => {
        clearCanvas();
      });
    };
    
    setup();
  }, [roomId]);

  const handleDraw = async (stroke) => {
    // Draw locally
    drawStroke(stroke);
    
    // Broadcast to others
    await channel.sendEvent({
      type: 'canvas_draw',
      data: { stroke }
    });
  };

  return <canvas onMouseMove={handleDraw} />;
};
```

### Pattern 3: Chat Room with Typing Indicators

```typescript
const ChatRoom = ({ roomId }) => {
  const { joinRoom } = useStream();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const setup = async () => {
      const ch = await joinRoom(roomId);
      setChannel(ch);
      
      // Load existing messages
      setMessages(ch.state.messages);
      
      // Listen for new messages
      ch.on('message.new', (event) => {
        setMessages(prev => [...prev, event.message]);
      });
      
      // Typing indicators
      ch.on('typing.start', (event) => {
        setTypingUsers(prev => [...prev, event.user.name]);
      });
      
      ch.on('typing.stop', (event) => {
        setTypingUsers(prev => prev.filter(u => u !== event.user.name));
      });
    };
    
    setup();
  }, [roomId]);

  const sendMessage = async (text) => {
    await channel.sendMessage({ text });
  };

  const handleTyping = async () => {
    await channel.keystroke(); // Simple!
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
      {typingUsers.length > 0 && (
        <div>{typingUsers.join(', ')} typing...</div>
      )}
      <input onChange={handleTyping} onSubmit={sendMessage} />
    </div>
  );
};
```

## Backend Integration

### Getting Stream Token (Already Implemented)

```javascript
// Backend: /api/stream/token
router.get('/token', authenticateToken, async (req, res) => {
  const streamToken = streamClient.createToken(req.user.id);
  
  res.json({
    token: streamToken,
    apiKey: process.env.STREAM_API_KEY,
    userId: req.user.id
  });
});
```

### Sending Events from Backend

```javascript
// Send friend request notification
const channel = streamClient.channel('messaging', `notifications-${receiverId}`);
await channel.sendEvent({
  type: 'friend_request_received',
  data: {
    sender: {
      id: senderId,
      displayName: senderName,
      username: senderUsername
    }
  },
  user_id: senderId
});
```

### Creating a Room from Backend

```javascript
// Create collaboration room
const roomChannel = streamClient.channel('messaging', `room-${roomId}`, {
  name: 'Collaboration Room',
  created_by_id: userId,
  members: [userId, friendId]
});

await roomChannel.create();
```

## Debugging Tips

### Enable Debug Logs
```typescript
// In stream-context.tsx initialization:
const streamClient = new StreamChat(apiKey, {
  enableInsights: true,
  enableWSFallback: true,
  logger: (logLevel, message, extraData) => {
    console.log(`[STREAM ${logLevel}]`, message, extraData);
  }
});
```

### Check Connection Status
```typescript
console.log('Client:', client);
console.log('User:', client.user);
console.log('Connection ID:', client.connectionId);
console.log('WS Connection:', client.wsConnection);
```

### Monitor All Events
```typescript
channel.on('*', (event) => {
  console.log(`[${event.type}]`, event);
});
```

## Common Issues & Solutions

### Issue: Events not received
```typescript
// Make sure you call watch() before listening!
const channel = client.channel('messaging', channelId);
await channel.watch(); // ← IMPORTANT
channel.on('my_event', handler);
```

### Issue: Can't send events
```typescript
// Check if user is connected
if (!client.userID) {
  console.error('User not connected to Stream');
  return;
}

// Check if channel is watched
if (!channel.initialized) {
  await channel.watch();
}
```

### Issue: TypeScript errors with event data
```typescript
// Cast event data to any or define interface
channel.on('custom_event', (event: Event) => {
  const data = event.data as { customField: string };
  console.log(data.customField);
});
```

## More Resources

- [Stream Chat React Docs](https://getstream.io/chat/docs/sdk/react/)
- [Stream Chat JavaScript Docs](https://getstream.io/chat/docs/javascript/)
- [Stream Video React SDK Docs](https://getstream.io/video/docs/react/)
- [Stream API Reference](https://getstream.io/chat/docs/javascript/reference/)
