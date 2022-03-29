import { Router} from 'express';
import { Mutex } from 'async-mutex';
import { setTimeout } from 'timers/promises';
import Debug from 'debug';
const debug=Debug('index.js');
const router=Router();
const sleepTime = 5000;
let expiringValue = Date.now();
const mutex = new Mutex();

router.get('/', async function(req, res, next){
  const caller = req.query.caller;
  let refreshed = false;
  if (isExpired()) {
    debug("caller "+caller+" refreshing");
    // simulate an api call to get a refreshed token
    await setTimeout(sleepTime);
    debug("caller "+caller+" refreshed.");
    expiringValue = Date.now();
    refreshed = true
  }
  res.json({
    caller,
    expiringValue,
    refreshed
  });
  next();
});

function isExpired() {
  return (Date.now() - expiringValue) > sleepTime;
}

/* GET home page. */
router.get('/locked', async function(req, res, next){
  const caller = req.query.caller;
  let refreshed = false;
  if (isExpired()) {
    debug("caller "+caller+" is expired");
    const release = await mutex.acquire();
    try {
      debug("caller "+caller+" acquired lock");
      if (isExpired()) {
        debug("caller "+caller+" refreshing");
        await setTimeout(sleepTime);
        expiringValue = Date.now();
        refreshed = true;
        debug("caller "+caller+" refreshed");
      }else{
        debug("caller "+caller+" already refreshed.");
      }
    } finally {
      release();
    }
  }
  res.json({
    caller,
    expiringValue,
    refreshed
  });
  next();
});

export {router};
