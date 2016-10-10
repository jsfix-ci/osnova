**OSNOVA**

The way to use the all power of multicore processors on the server made on node.js.

Include:
- Express as a web server.
- Passport as an authorization system.
- Mongoose for work with MongoDB.
- Axon for IPC.
- Socket.IO for the client-server communication.

Every worker and the master are isolated processes. A web-server starts on the every worker. So any client requests must be processed in a worker code.
Master is used to distribute client connections between workers and provides communication of workers with master and between each other. 

Wow such ready-to-go much time to watch anime!

##Install

    npm i osnova [--save] [--production]

 Use **--production** in the most cases. It will not install any build-related stuff. (Honestly, there is no reason to build it by yourself.)

###Usage
    
    const OSNOVA = require('osnova');
    const osnovaMaster = OSNOVA.Server(/* masterOpts */);
    const osnovaWorker = OSNOVA.Server(/* workerOpts */);
    
    OSNOVA.launch({
      worker: () => { osnovaWorker.start(); },
      master: () => { osnovaMaster.start(); },
      config: {
        threads: 3,
        host: { ip: 'localhost', port: 3337 }
      }
    });
    
####osnova object

Any component of OSNOVA can be accessed from `osnova` object.

Access to `osnova` object:

- Functions `init` and `start` from `opts` of `OSNOVA.Server(opts)` 
will be called with `osnova` object as a parameter when their time comes.
    
        const workerOpts = {
            init: (osnova) => {
                myExpressRoute(osnova);
                IPCStuffWorker(osnova);
            },
            start: (osnova) => {
                allComponentsAreInitializedLetsRock(osnova);
            }
        }
        const osnovaWorker = OSNOVA.Server(workerOpts);
    
- `OsnovaServer.use()` takes function that will be executed with `osnova` as first parameter. See [OsnovaServer](#osnovaserver)

There is no way to get this object directly in any other location in code.

   
#####osnova.express
    function myExpressRoute(osnova) {
        const app = osnova.express;
        app.get('/myroute', (req, res) => { res.send('hello') });
    }

##API 
###OSNOVA
OSNOVA module interface.
####.Server(opts)
**@in** `opts` - options object  
**@return** `OsnovaServer` - public OSNOVA server interface  
Starts OSNOVA server on the master or on a worker.
This is a default import and available via:

    import OSNOVA from 'osnova'
    const OsnovaServer = OSNOVA({/* opts */});
    
**!** - option required to be explicitly defined on both.  **W!** - required for worker.  **M!** - required for master.  

- **opts.master** [true/false]: 
Default: false. Flag. Is current instance of osnova will be launched in master thread.
- **opts.init** [function(osnova object)]: 
Function-initializer. Will be executed in the end of init stage and will have access to all init-stage systems.
- **opts.start** [function(osnova object)]:
Function-starter. Will be executed in the end of starting stage.
- **opts.core** [object]:
- **opts.core.paths** [object]:
- `!`**opts.core.paths.root** [string]: Absolute project root path. MUST be defined! Used in Express and in low-level configurator.
- **opts.core.paths.public** [string]: Relative path from project root to public web-server folder. `Default: './public'`
- **opts.core.paths.views** [string]: Relative path from project root to template-views folder. `Default './private/views'`
- **opts.core.template** [string]: Template engine. Default: 'pug'.
- **opts.core.target** [object]: Target configuration.
- **opts.core.target.database** [object]:
- `!`**opts.core.target.database.uri** [string]: MongoDB connection URI. 
- `!`**opts.core.target.database.path** [string]: MongoDB connection URL. Will be used if no `uri` specified.
- `!`**opts.core.target.database.name** [string]: MongoDB database name. Will be used if no `uri` specified.

####.launch(opts)
**@in** `opts` - options object  
**@return** -  

Entry point of multithreaded application. It takes config, master and worker functions and launch its in master and workers threads respectively.

- `!`**opts.worker** [function]: Worker function.
- `!`**opts.master** [function]: Master function.
- **opts.config** [object]:
- **opts.config.threads** [integer]: Number of worker-threads to be spawned. Default: 1.
- **opts.config.host** [object]:
- **opts.config.host.ip** [string]: Server IP of the application. Default: 'localhost'.
- **opts.config.host.port** [integer]: Web-server port of the application. Default: '8080'.

###OsnovaServer

OsnovaServer is an object returned by `OSNOVA.Server()`

####.use(fn, args)
**@in** `fn` [function]  
**@in** `args` [any]  
**@return** -  
Adds custom function that will be executed on `starting` state. 
First arguments of function is always `osnova` object and should not be included in `args` list. 
It will be provided automatically by OSNOVA. Because of it - `args` can be undefined|null.

    OsnovaServer.use((osnova) => {
        console.log('I have access to osnova here', osnova.communicator.ipc);
    });

####.start()
**@in** -  
**@return** -  
Starts the server. Any code in flow after this function will never be executed.


###Samples

[Very basic sample application](https://github.com/Noviel/osnova-basic-application)

