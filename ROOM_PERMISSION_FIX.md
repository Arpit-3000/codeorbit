# 🚨 Critical Backend Fix Required - Stream Permissions

## Problem
```
Error: User '6a2bebb7ee20c0d47db7bdf0' with role 'user' is not allowed to perform action ReadChannel
```

## Root Cause
**Backend is NOT creating/adding Stream users to room channels properly.**

When a room is created, the backend MUST:
1. ✅ Create/update both users in Stream
2. ✅ Create room channel with BOTH users as members
3. ✅ Send proper permissions

## Backend Fix Required

### File: `backend/routes/pingRoutes.js` or `backend/controllers/pingController.js`

```javascript
// When accepting a ping request
exports.acceptPing = async (req, res) => {
  try {
    const { pingId } = req.params;
    const acceptorId = req.user.id; // User B (acceptor)
    
    // 1. Get ping request
    const ping = await PingRequest.findById(pingId);
    const senderId = ping.sender._id; // User A (sender)
    
    // 2. Get both users from database
    const [sender, acceptor] = await Promise.all([
      User.findById(senderId),
      User.findById(acceptorId)
    ]);
    
    // 3. ✅ CRITICAL: Upsert BOTH users in Stream
    const streamClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY,
      process.env.STREAM_API_SECRET
    );
    
    await streamClient.upsertUsers([
      {
        id: sender._id.toString(),
        name: sender.displayName || sender.username || sender.email,
        image: sender.photoURL || sender.profileImage,
        role: 'user' // Make sure role has channel permissions
      },
      {
        id: acceptor._id.toString(),
        name: acceptor.displayName || acceptor.username || acceptor.email,
        image: acceptor.photoURL || acceptor.profileImage,
        role: 'user'
      }
    ]);
    
    console.log('[STREAM] ✅ Both users upserted in Stream');
    
    // 4. Create room
    const roomId = uuidv4();
    const streamChannelId = `room-${roomId}`;
    
    // 5. ✅ CRITICAL: Create channel with BOTH users as members
    const channel = streamClient.channel('messaging', streamChannelId, {
      name: 'Collaboration Room',
      created_by_id: acceptorId.toString(),
      members: [sender._id.toString(), acceptor._id.toString()], // BOTH users
    });
    
    await channel.create();
    console.log('[STREAM] ✅ Channel created with both members');
    
    // 6. Create room in database
    const room = new Room({
      roomId,
      streamChannelId,
      participants: [senderId, acceptorId],
      createdBy: acceptorId,
      status: 'active'
    });
    
    await room.save();
    
    // 7. Update ping status
    ping.status = 'accepted';
    ping.roomId = roomId;
    await ping.save();
    
    // 8. ✅ Send ping_accepted event to SENDER
    const senderChannel = streamClient.channel('messaging', `notifications-${senderId}`);
    await senderChannel.sendEvent({
      type: 'ping_accepted',
      data: {
        roomId: roomId,
        streamChannelId: streamChannelId,
        acceptedBy: acceptorId.toString()
      }
    });
    
    console.log('[STREAM] ✅ ping_accepted event sent to sender');
    
    res.json({
      success: true,
      roomId: roomId,
      streamChannelId: streamChannelId,
      message: 'Ping accepted and room created'
    });
    
  } catch (error) {
    console.error('[ACCEPT PING] Error:', error);
    res.status(500).json({ message: 'Failed to accept ping' });
  }
};
```

### File: `backend/routes/streamRoutes.js`

```javascript
// When generating Stream token
exports.getStreamToken = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user from database
    const user = await User.findById(userId);
    
    const streamClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY,
      process.env.STREAM_API_SECRET
    );
    
    // ✅ ALWAYS upsert user when getting token
    await streamClient.upsertUser({
      id: userId.toString(),
      name: user.displayName || user.username || user.email,
      image: user.photoURL || user.profileImage,
      role: 'user' // Make sure role has permissions
    });
    
    console.log('[STREAM] User upserted:', userId);
    
    // Generate token
    const token = streamClient.createToken(userId.toString());
    
    res.json({
      token,
      apiKey: process.env.STREAM_API_KEY,
      userId: userId.toString()
    });
    
  } catch (error) {
    console.error('[STREAM TOKEN] Error:', error);
    res.status(500).json({ message: 'Failed to generate Stream token' });
  }
};
```

### File: `backend/routes/roomRoutes.js`

```javascript
// When closing a room
exports.closeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    // Get room
    const room = await Room.findOne({ roomId }).populate('participants');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Update room status
    room.status = 'closed';
    room.closedBy = userId;
    room.closedAt = new Date();
    await room.save();
    
    // ✅ CRITICAL: Send room_closed event to ALL participants via Stream
    const streamClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY,
      process.env.STREAM_API_SECRET
    );
    
    const channel = streamClient.channel('messaging', room.streamChannelId);
    
    await channel.sendEvent({
      type: 'room_closed',
      data: {
        roomId: roomId,
        closedBy: userId.toString(),
        closedAt: new Date().toISOString()
      }
    });
    
    console.log('[ROOM CLOSE] ✅ room_closed event sent to all participants');
    
    res.json({
      success: true,
      message: 'Room closed successfully'
    });
    
  } catch (error) {
    console.error('[CLOSE ROOM] Error:', error);
    res.status(500).json({ message: 'Failed to close room' });
  }
};
```

## Stream Dashboard Configuration

Make sure your Stream app has proper permissions:

1. Go to Stream Dashboard: https://dashboard.getstream.io/
2. Select your app
3. Go to **Roles & Permissions**
4. Make sure `user` role has these permissions:
   - ✅ ReadChannel
   - ✅ CreateChannel
   - ✅ UpdateChannel
   - ✅ JoinChannel
   - ✅ SendMessage
   - ✅ SendCustomEvent

## Testing Checklist

After backend fix:

### Test 1: Ping Accept Flow
- [ ] User A sends ping to User B
- [ ] User B accepts ping
- [ ] **Backend creates Stream users for BOTH**
- [ ] **Backend creates channel with BOTH as members**
- [ ] **User A receives `ping_accepted` event**
- [ ] **User A navigates to room automatically**
- [ ] **Both users can join room channel**
- [ ] **No permission errors**

### Test 2: Chat in Room
- [ ] **Both users can send messages**
- [ ] **Both users receive messages**
- [ ] Typing indicators work
- [ ] Message history loads

### Test 3: Room Close
- [ ] User A clicks "Close Room"
- [ ] **Backend sends `room_closed` event**
- [ ] **User B receives event**
- [ ] **Both users redirect to /social**
- [ ] **Both users' video/audio stops**
- [ ] Room marked as closed in DB

## Debug Commands

### Check if Stream user exists:
```bash
curl -X GET "https://chat.stream-io-api.com/users?id=USER_ID&api_key=YOUR_API_KEY" \
  -H "Authorization: YOUR_SERVER_SIDE_TOKEN"
```

### Check channel members:
```bash
curl -X GET "https://chat.stream-io-api.com/channels/messaging/CHANNEL_ID/query?api_key=YOUR_API_KEY" \
  -H "Authorization: YOUR_SERVER_SIDE_TOKEN"
```

## Priority: CRITICAL 🔴
Without this backend fix, the collaboration feature WILL NOT WORK.

