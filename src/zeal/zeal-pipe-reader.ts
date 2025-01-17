import net from 'net';
import { Socket } from 'net';
import find from 'find-process';
import { BrowserWindow } from "electron";
import { ZealPipe } from './zeal-pipes';

export default class ZealPipeReader {
    eqgamePids = new Set();
    outputWindows: BrowserWindow[] = [];

    constructor(outputWindows: BrowserWindow[]) {
        this.outputWindows = outputWindows;
        this.initializeZealPipes();
    }

    initializeZealPipes = () => {
        this.readZealPipes();
        setInterval(async () => this.readZealPipes(), 10_000);
    };

    // Find eqgame processes every 10 seconds and try to read zeal pipes
    readZealPipes = async () => {
        const processes = await find("name", "eqgame");
        processes
            .filter((process) => !this.eqgamePids.has(process.pid))
            .forEach((process) => {
                this.readZealPipesForPid(process.pid);
            });
    };

    readZealPipesForPid = (pid: number) => {
        // Check if we're already reading zeal pipes for the PID
        if (this.eqgamePids.has(pid)) {
            return;
        }

        // Connect to zeal pipes
        const pipeName = `\\\\.\\pipe\\zeal_${pid}`;
        const pipeClient = net.createConnection(pipeName);

        // Handle connection failures
        pipeClient.on("connectionAttemptFailed", () =>
            this.onPipeConnectionFailed(pipeClient, pid)
        );
        pipeClient.on("connectionAttemptTimeout", () =>
            this.onPipeConnectionFailed(pipeClient, pid)
        );

        // Handle connection success and data
        pipeClient.on("connect", () => {
            this.eqgamePids.add(pid);
            console.log(`Reading zeal pipes on ${pid}`);
        });
        pipeClient.on("data", this.onData);
    };

    onPipeConnectionFailed = (pipeClient: Socket, pid: number) => {
        this.eqgamePids.delete(pid);
        pipeClient.destroy();
    };

    onData = (buffer: Buffer) => {
        // Arrayify the buffer; multiple pipes often get thrown into the same buffer
        const arrayifiedJsonString = `[${buffer
            .toString()
            .replace(/}\s*{/g, "},{")}]`;
                        
        try {
            const pipes = JSON.parse(arrayifiedJsonString).map((datum: ZealPipe) => ({
                ...datum,
                data: JSON.parse(datum.data as unknown as string),
            }));
            // Send the pipes to the output windows
            this.outputWindows.forEach((window) =>
                window.webContents.send("on-zeal-pipes", pipes)
            );
        }catch(ex) {
            console.log('Error parsing zeal pipe', arrayifiedJsonString);
        }
    };
}
