var i=0;
 
function timedCount()
{
i=i+1;
postMessage(i);                   //posts a message back to the HTML page.
setTimeout("timedCount()",500);
}
 
timedCount();