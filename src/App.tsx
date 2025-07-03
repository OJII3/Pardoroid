import { invoke } from "@tauri-apps/api/core";
import { Home, Terminal } from "lucide-react";
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { SshManager } from "./components/SshManager";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">
        Pardoroid SSH Client
      </h1>

      <Tabs defaultValue="home" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="home" className="flex items-center gap-2">
            <Home size={16} />
            Home
          </TabsTrigger>
          <TabsTrigger value="ssh" className="flex items-center gap-2">
            <Terminal size={16} />
            SSH Manager
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="pt-6">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-6 mb-6">
              <a href="https://vitejs.dev" rel="noopener" target="_blank">
                <img alt="Vite logo" height={60} src="/vite.svg" width={60} />
              </a>
              <a href="https://tauri.app" rel="noopener" target="_blank">
                <img alt="Tauri logo" height={60} src="/tauri.svg" width={60} />
              </a>
              <a href="https://reactjs.org" rel="noopener" target="_blank">
                <img alt="React logo" height={60} src={reactLogo} width={60} />
              </a>
            </div>

            <p className="text-lg text-center text-muted-foreground mb-6">
              A multiplatform SSH client with Kitty Graphics Protocol support
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                greet();
              }}
              className="flex gap-2"
            >
              <Input
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Enter a name..."
                value={name}
              />
              <Button type="submit">Greet</Button>
            </form>

            {greetMsg && <p className="text-blue-600 mt-4">{greetMsg}</p>}
          </div>
        </TabsContent>

        <TabsContent value="ssh" className="pt-6">
          <SshManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
