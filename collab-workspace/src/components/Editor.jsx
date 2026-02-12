import { useEffect, useState } from 'react';
import { socket } from '../services/socket';

const Editor = ({ roomId }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    socket.connect();
    socket.emit('join-room', roomId);

    
    socket.on('receive-changes', (newContent) => {
      setContent(newContent);
    });

    return () => socket.disconnect();
  }, [roomId]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    
    socket.emit('send-changes', { roomId, content: val });
  };

  return (
    <textarea 
      className="w-full h-screen p-4 border-none focus:outline-none"
      value={content}
      onChange={handleChange}
      placeholder="Ekhane likha shuru koro..."
    />
  );
};

export default Editor;