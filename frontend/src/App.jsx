import "./index.css";
import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const [username, setUserName] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  });
  console.log(window.location.search);

  const [user, setUsers] = useState([]);
  console.log(user);

  const editorRef = useRef(null);
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);
  console.log(ydoc, " +", yText);
  
  const handleMount = (editor) => {
    editorRef.current = editor;

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    );
  };
  // console.log(user);

  const handleJoin = (e) => {
    e.preventDefault();
    setUserName(e.target.username.value);
    window.history.pushState({}, "", "?username=" + e.target.username.value);
  };

  useEffect(() => {
    // console.log(username);

    if (username) {
      const provider = new SocketIOProvider("/", "monaco", ydoc, {
        autoConnect: true,
      });
      console.log(provider);

      provider.awareness.setLocalStateField("user", { username });
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(
        states
          .filter((state) => state.user && state.user.username)
          .map((state) => state.user),
      );
      console.log(states);

      provider.awareness.on("change", () => {
        const states = Array.from(provider.awareness.getStates().values());
        setUsers(
          states
            .filter((state) => state.user && state.user.username)
            .map((state) => state.user),
        );

        // // console.log(states);

        // setUsers(
        //   states
        //     .filter((state) => state.user && user.username)
        //     .map((state) => state.user.username),
        // );
      });

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null);
      }

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        provider.disconnect();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [username]);

  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-50 flex justify-center items-center gap-4 p-4">
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4 bg-sky-300 w-fit p-4 rounded-lg"
        >
          <input
            className="font-bold border rounded-lg p-1.5"
            name="username"
            type="text"
            placeholder="Enter your name "
            autoComplete="true"
          />
          <button className="p-2 rounded-lg bg-amber-50 text-grey-50 font-bold">
            Join
          </button>
        </form>
      </main>
    );
  }
  return (
    <main className="h-screen w-full  flex gap-4 bg-pink-400 p-2.5">
      <aside className="h-full w-1/2 bg-gray-300  rounded-lg p-1.5">
        <h1 className="text-black flex items-center justify-center mt-2 font-bold text-2xl">
          Users
        </h1>
        <hr className="m-4" />
        {user.map((user, key) => (
          <li
            key={key}
            className="flex items-center justify-between px-4 py-2 mb-2 transition-colors duration-200 rounded-lg bg-blue-50 hover:bg-blue-100"
          >
            <span className="font-semibold text-blue-900 capitalize">
              {user.username}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-blue-700/70">
                Online
              </span>
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
                <span className="relative inline-flex w-2 h-2 bg-green-500 rounded-full"></span>
              </span>
            </div>
          </li>
        ))}
      </aside>
      <section className="w-3/4 bg-neutral-700 overflow-hidden rounded-lg pt-0.5 ">
        <Editor
          theme="vs-dark"
          defaultLanguage="javascript"
          height="100%"
          defaultValue="merge-Edit"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;
