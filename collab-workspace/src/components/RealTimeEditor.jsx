import { useEffect, useState, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Moon, Sun, Share2, Camera, Send, MessageSquare, Circle } from 'lucide-react';
import { socket } from '../services/socket';

const RealTimeEditor = ({ roomId = "high-voltage-room" }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typer, setTyper] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [myAvatar, setMyAvatar] = useState(localStorage.getItem('userAvatar') || null);
  
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Image Compression logic
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 120;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * (MAX_WIDTH / img.width);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          setMyAvatar(compressed);
          localStorage.setItem('userAvatar', compressed);
          socket.emit("update-avatar", { roomId, avatar: compressed });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const me = users.find(u => u.id === socket.id);
    const msgData = { roomId, sender: me?.name || "User", text: newMessage, time };

    socket.emit("send-message", msgData);
    setMessages(prev => [...prev, { ...msgData, sender: "You" }]);
    setNewMessage("");
  };

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: { toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'clean']] },
      });
      quillInstance.current.on('text-change', (d, od, source) => {
        if (source === 'user') {
          socket.emit("send-changes", { roomId, content: quillInstance.current.root.innerHTML });
          socket.emit("typing", { roomId, isTyping: true });
          clearTimeout(window.tTimer);
          window.tTimer = setTimeout(() => socket.emit("typing", { roomId, isTyping: false }), 1000);
        }
      });
    }

    socket.connect();
    socket.emit("join-room", { roomId, avatar: myAvatar });

    socket.on("load-document", (data) => { if (data) quillInstance.current.root.innerHTML = data; });
    socket.on("load-chat-history", (history) => {
        const myName = `User-${socket.id?.substring(0, 4)}`;
        const formatted = history.map(m => ({ ...m, sender: m.sender === myName ? "You" : m.sender }));
        setMessages(formatted);
    });
    socket.on("receive-changes", (content) => {
      const sel = quillInstance.current.getSelection();
      quillInstance.current.root.innerHTML = content;
      if (sel) quillInstance.current.setSelection(sel);
    });
    socket.on("user-list-update", (list) => setUsers(list));
    socket.on("receive-message", (msg) => setMessages(prev => [...prev, msg]));
    socket.on("display-typing", (d) => setTyper(d.isTyping ? d.userName : null));

    return () => { socket.off(); socket.disconnect(); };
  }, [roomId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`flex items-center justify-between px-6 py-2.5 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">HV</div>
          <h1 className="text-xs font-black uppercase">HV Workspace</h1>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
          {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-72 hidden md:flex flex-col border-r ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-800/10 flex items-center gap-3">
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
               <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500 bg-slate-200 flex items-center justify-center">
                 {myAvatar ? <img src={myAvatar} className="w-full h-full object-cover" /> : <Camera size={16} />}
               </div>
               <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
             </div>
             <p className="text-xs font-bold text-indigo-500">My Identity</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-[9px] font-black text-slate-500 uppercase mb-4">Collaborators</h3>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-2 text-[11px]">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{u.name.charAt(5)}</div>}
                  </div>
                  <span className={u.id === socket.id ? 'text-indigo-500 font-bold' : ''}>{u.id === socket.id ? "You" : u.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`h-80 border-t flex flex-col ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
             <div className="p-2 border-b border-slate-800/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={12} className="text-indigo-500" /> Team Chat
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px] custom-scrollbar">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.sender === "You" ? "items-end" : "items-start"}`}>
                    <div className={`px-3 py-1.5 rounded-2xl max-w-[85%] ${m.sender === "You" ? "bg-indigo-600 text-white rounded-br-none" : "bg-slate-100 dark:bg-slate-800 rounded-bl-none border border-slate-800/10"}`}>
                      {m.text}
                    </div>
                    <span className="text-[8px] text-slate-500 mt-1">{m.sender} • {m.time}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
             </div>
             <form onSubmit={handleSendMessage} className="p-2 flex gap-1">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Say hi..." className="flex-1 bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-[11px] outline-none" />
                <button type="submit" className="bg-indigo-600 p-1.5 rounded-lg text-white"><Send size={14}/></button>
             </form>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col items-center">
            <div className="w-full max-w-4xl h-full flex flex-col">
              <div className="h-6 mb-1 text-[11px] font-bold text-indigo-500 italic">
                {typer && `✍️ ${typer} is editing...`}
              </div>
              <div className={`flex-1 shadow-2xl rounded-2xl overflow-hidden ${darkMode ? 'quill-dark' : 'quill-light'}`}>
                <div ref={editorRef} className="h-full"></div>
              </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default RealTimeEditor;