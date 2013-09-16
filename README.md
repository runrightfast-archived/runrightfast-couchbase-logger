# runrightfast-couchbase-logger

Logging Service logger that writes events to Couchbase

## Prerequisites
- Requires the C client, libcouchbase, to be installed - see http://www.couchbase.com/communities/c/getting-started
- Running tests requires a local Couchbase server running and buckets named: 
 - default - used for testing Couchbase SDK
 - event-log - used to store event logs