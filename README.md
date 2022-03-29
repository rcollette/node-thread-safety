# Node Thread-Safety Example
A common explanation of node thread-safety is often that since Node
is "single threaded", all threads are safe.

A more qualified answer may state "except when it comes to asynchronous  tasks", or "when using globals".

The problem is that ignoring the asynchronous nature of Node during I/O operations or longer running tasks can lead to unintended consequences.   For example, suppose you have some code that maintains a single OIDC token that is being used to call an API on another host.  You should maintain a single instance of that token, until it expires (or near to it to accommodate for clock skew).  Two requests come in and it is determined that the token needs to be refreshed.   Request1 makes a token refresh API call, Request2, unaware of the token refresh being performed by Request1, also issues a token refresh call.  Now multiply that by however many requests come in while waiting on the refresh API call to complete.  Many people will say, all the tokens that are retrieved will work, no harm no foul, but nothing is free.  In many cases, such token refresh calls will be throttled or limited.

If it takes time T to retrieve a refreshed OIDC token.   All requests that are performing this refresh will now have to wait time T before they can continue.  When Request2 comes in .5T after Request1, if Request2 waited for Request1 to complete the refresh of the shared token, Request2 would only have to wait .5T for the token to be refreshed, and the wait time only improves for subsequent requests that need to wait for the token to be refreshed.

Some general rules of thumb when working with module globals or singleton class members that are shared by requests:

1. Set once during construction or global module initialization.  If setting is asynchronous, and done one time only, set the global/member to a Promise or Promise'T.
2. If a global/member value needs to be updated, use some locking/synchronizing mechanism, such as a mutex, to prevent multiple updates.  If an update condition is true, after entering the synchronized code block, check again if the value needs to be updated.  The value may already have been updated while waiting on a lock to be released.

Video demonstration
https://youtu.be/ZTiiA4ABtOc
