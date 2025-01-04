# Issue Log

## Database Connection 

### Unauthorized to execute "app_updates"

#### Error: 
```
MongoError: (Unauthorized) not authorized on admin to execute command { find: "app_updates", filter: { key: "0.0.2-admins" }, projection: {  }, limit: 1, singleBatch: true, batchSize: 1 }
```

This was caused when Keystone's `updates` folder files were trying to run. 

#### Investigation: 

- Modified syntax in update file to use the `function(done)` instead of `exports.create`
- Added every role possible to the admin user used to connect to the database in Atlas
- Downgraded MongoDB to 2.12

#### Resolution

Found this thread with [a comment](https://www.mongodb.com/community/forums/t/unauthorized-not-authorized-on-admin-to-execute-command/128928/6) about how the OP was connecting to the admin database, when they should be connecting to the automatic "test" or some other created database. 

I went into the Mongo Atlas cluster & created a database named "recyclr". Then, I updated the MONGODB_URI to include the database: 

```diff
mongodb://<user>:<pass>@cluster0-shard-00-00.5h1xe.mongodb.net:27017,cluster0-shard-00-01.5h1xe.mongodb.net:27017,cluster0-shard-00-02.5h1xe.mongodb.net:27017/recyclr?ssl=true&replicaSet=atlas-taosec-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
```

### Unsupported OP_QUERY

#### Error:
```
MongoError: Unsupported OP_QUERY command: find. The client driver may require an upgrade. For more details see https://dochub.mongodb.org/core/legacy-opcode-removal
```

#### Investigration

- Upgraded local mongodb & mongoose versions
- Determined KeystoneJS v4 only requires MongoDB v2.4 
  - The legacy error is coming from MongoDB versions below 3.6
- Even with upgraded local packages, KeystoneJS v4 is likely still using legacy code
  - Do we need to upgrade to KeystoneJS v5?
- MongoDB Atlas does not allow clusters lower than MongoDB v6

Local Mongod version 
```
Build Info: {
    "version": "5.0.7",
    "gitVersion": "b977129dc70eed766cbee7e412d901ee213acbda",
    "modules": [],
    "allocator": "system",
    "environment": {
        "distarch": "x86_64",
        "target_arch": "x86_64"
    }
}
```

#### Resolution

Decided to to create a v2.4 mongodb database and open it to connections on digital ocean droplet

Update: Earliest archived mongodb version available is v2.6 which is still lower than v3.6 so we'll try that one. 

Steps:
- Followed [this guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu-tarball/) for installing with tgz file
- Used `scp` to transfer locally downloaded tgz file to droplet
  - `scp ~/Downloads/mongodb-linux-x86_64-2.6.0.tgz eron@143.198.132.99:~/`
- Copied binary files to `/usr/local/bin`
- Created `/data/db` folder
- Ran `mongod` instance in the background with `mongod --fork --logpath /var/log/mongod.log`
- Checked connection with `mongo` and was connected successfully to `test` database
- Followed [remote access guide](https://www.digitalocean.com/community/tutorials/how-to-configure-remote-access-for-mongodb-on-ubuntu-20-04) which included updating UFW firewall and adding IPs to `mongod.conf` file
  - Had some trouble with using my computer's IP addresses
  - Successfully allowed all connections to port 27017 which should be fine, this is all just dummy data

## Node Internal Out of Memory

There is an error when trying to create multiple items after one another. 

```
------------------------------------------------
KeystoneJS v4.2.1 started:
Recylcr 2.0 is ready on http://0.0.0.0:3000
------------------------------------------------

GET /keystone/api/materials?fields=name&limit=100&sort=&expandRelationshipFields=true 200 305.473 ms
POST /keystone/api/materials/create 403 108.388 ms
GET /keystone/materials 200 109.307 ms
GET /keystone/api/materials?fields=name&limit=100&sort=&expandRelationshipFields=true 304 293.552 ms
POST /keystone/api/materials/create 200 331.306 ms
GET /keystone/api/materials/6779ba687ecdaa81a8dce229?drilldown=true 200 187.494 ms
GET /keystone/api/items?filters=%7B%22material%22%3A%7B%22value%22%3A%226779ba687ecdaa81a8dce229%22%7D%7D&fields=name%2Clevel%2Cstatus&expandRelationshipFields=true 200 291.291 ms
GET /keystone/api/materials?fields=name&limit=100&sort=&expandRelationshipFields=true 200 281.041 ms

<--- Last few GCs --->

[33192:0x138008000]    33911 ms: Scavenge 47.9 (50.6) -> 47.0 (50.6) MB, 0.71 / 0.00 ms  (average mu = 0.992, current mu = 0.960) allocation failure; 
[33192:0x138008000]    33914 ms: Scavenge 48.0 (50.6) -> 47.1 (50.6) MB, 0.75 / 0.00 ms  (average mu = 0.992, current mu = 0.960) allocation failure; 
[33192:0x138008000]    33917 ms: Scavenge 48.0 (50.6) -> 47.1 (50.6) MB, 0.71 / 0.00 ms  (average mu = 0.992, current mu = 0.960) allocation failure; 


<--- JS stacktrace --->

FATAL ERROR: RegExpCompiler Allocation failed - process out of memory
----- Native stack trace -----

 1: 0x1026a159c node::Abort() [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 2: 0x1026a179c node::ModifyCodeGenerationFromStrings(v8::Local<v8::Context>, v8::Local<v8::Value>, bool) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 3: 0x10282695c v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 4: 0x102d907c8 v8::internal::ActionNode::GreedyLoopTextLength() [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 5: 0x102d84f0c v8::internal::RegExpAlternative::ToNode(v8::internal::RegExpCompiler*, v8::internal::RegExpNode*) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 6: 0x102d84eb0 v8::internal::RegExpCapture::ToNode(v8::internal::RegExpTree*, int, v8::internal::RegExpCompiler*, v8::internal::RegExpNode*) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 7: 0x102d903e8 v8::internal::RegExpCompiler::PreprocessRegExp(v8::internal::RegExpCompileData*, v8::base::Flags<v8::internal::RegExpFlag, int>, bool) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 8: 0x102dadbac v8::internal::RegExpImpl::Compile(v8::internal::Isolate*, v8::internal::Zone*, v8::internal::RegExpCompileData*, v8::base::Flags<v8::internal::RegExpFlag, int>, v8::internal::Handle<v8::internal::String>, v8::internal::Handle<v8::internal::String>, bool, unsigned int&) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
 9: 0x102dad518 v8::internal::RegExpImpl::CompileIrregexp(v8::internal::Isolate*, v8::internal::Handle<v8::internal::JSRegExp>, v8::internal::Handle<v8::internal::String>, bool) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
10: 0x102dac784 v8::internal::RegExpImpl::IrregexpPrepare(v8::internal::Isolate*, v8::internal::Handle<v8::internal::JSRegExp>, v8::internal::Handle<v8::internal::String>) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
11: 0x102daca90 v8::internal::RegExpImpl::IrregexpExec(v8::internal::Isolate*, v8::internal::Handle<v8::internal::JSRegExp>, v8::internal::Handle<v8::internal::String>, int, v8::internal::Handle<v8::internal::RegExpMatchInfo>, v8::internal::RegExp::ExecQuirks) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
12: 0x102dac87c v8::internal::RegExp::Exec(v8::internal::Isolate*, v8::internal::Handle<v8::internal::JSRegExp>, v8::internal::Handle<v8::internal::String>, int, v8::internal::Handle<v8::internal::RegExpMatchInfo>, v8::internal::RegExp::ExecQuirks) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
13: 0x102dcca44 v8::internal::Runtime_RegExpExec(int, unsigned long*, v8::internal::Isolate*) [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
14: 0x10311cc44 Builtins_CEntry_Return1_ArgvOnStack_NoBuiltinExit [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
15: 0x1031892d8 Builtins_RegExpReplace [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
16: 0x10310db6c Builtins_StringPrototypeReplace [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
17: 0x1030943e4 Builtins_InterpreterEntryTrampoline [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
18: 0x103091708 construct_stub_create_deopt_addr [/Users/eronsalling/.nvm/versions/node/v20.11.1/bin/node]
```

### Investigation

- Switched to latest node version
- 