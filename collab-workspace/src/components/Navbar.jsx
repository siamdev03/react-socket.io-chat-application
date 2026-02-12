import { Moon, Sun, Share2 } from 'lucide-react';

const Navbar = ({ darkMode, setDarkMode, roomId }) => {
  return (
    <nav className={`flex items-center justify-between px-6 py-3 border-b ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-800 shadow-sm'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">HV</div>
        <div>
          <h1 className="text-sm font-bold leading-none">High-Voltage Docs</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Room: {roomId}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full transition-all ${darkMode ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-gray-100 text-slate-600'}`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md">
          <Share2 size={16} /> Share
        </button>
      </div>
    </nav>
  );
};

export default Navbar;