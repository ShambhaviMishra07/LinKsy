import {useEffect, useState} from 'react';
import {useSocket} from '../context/SocketContext';

export default function Chat() {
    const {socket} = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const roomId = 'general';

    useEffect(() => {
        if(!socket ) return;

        //join the room when component loads
        socket.emit('join_room', roomId);

        //listen for incoming messages
        //this runs every time the server emits 'receive message'
        socket.on('receive_message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        //cleanup: stop listening when component unmounts
        //without this you would get duplicate message on re-renders
        return() => {
            socket.off('receive_message');
            socket.emit('leave_room', roomId);
        };
    }, [socket]);

    const sendMessage = () => {
        if(!input.trim()) return;

        //emit the event to the server
        socket.emit('send_message', {
            roomId,
             content: input
        });
        setInput('');
    };

     return (
    <div>
      <div>
        {messages.map(msg => (
          <div key={msg._id}>
            <strong>{msg.sender.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}