<!DOCTYPE HTML>
<html>


<?php

//header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
header ("Expires: ".gmdate("D, d M Y H:i:s", time())." GMT");  
header ("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); 
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header ("Pragma: no-cache");  

if (isset($_POST['txt']) )
{
	$text=htmlentities($_POST['txt']);
	$num = rand(0,10);

	$filename='snd/'.htmlentities($_POST['txt']).'.mp3';
	//$filename='snd/'.$num.'.mp3';
	
	$querystring = http_build_query(array(
		//you can try other language codes here like en-english,hi-hindi,es-spanish etc
		"tl" => "en",
		"q" => $text
	));

	// remove old if existe

	//clearstatcache();

	if ($soundfile = file_get_contents("http://translate.google.com/translate_tts?".$querystring))
	{
		//

	    if(file_exists($filename)){ 
			echo("<br /> File existe !!");
			    if (is_writable($filename)) {
	    	        echo("<br /> file is writable");
	    	        clearstatcache();
	    	        fclose($filename);
	    	      //  
	    	       // if (!$handle = fopen($filename,'w+')){ echo "Impossible d'ouvrir le fichier ($filename)"; exit;}
	    	       // if ( fwrite($handle, $soundfile) === FALSE){ echo "Impossible d'écrire dans le fichier ($filename)"; exit;}
	    	      //  echo "L'écriture de ($soundfile) dans le fichier ($filename) a réussi";
	    	        //fclose($handle);
	    	       // touch($filename);//
	    	        
	    	        if (unlink($filename)){ 
	    	        	
	    	        	echo "<br /> old file is delete <br />";
	    	        	file_put_contents($filename,$soundfile);
	    	        	//chmod($filename, 01777);
	    	        	chmod($filename, 0777);
	    	        }
	    	        
	    	        
	    	        //unlink ($filename);
	    	        //
	            } else {
	    	        echo("<br /> File is not writable");
	            }
			
			//array_walk(glob($filename), 'unlink');
			 } else {
		    echo ("<br /> Create new File $filename");
		    file_put_contents($filename,$soundfile);
		    //chmod($filename, 01777);
		    chmod($filename, 0777);

		  //  clearstatcache();
	    }

		//file_put_contents($filename,$soundfile);
		//chmod($filename, 01777);/*<audio autoplay="autoplay"><source src="'.$filename.'" type="audio/mp3" rel="noreferrer"/></audio><br />*/
		echo ('
			
			<audio autoplay="autoplay"><source src="'.$filename.'" type="audio/mpeg" rel="noreferrer"/></audio><br />
			current text :'.$text.'<br />
			file: '.$filename.'
			'
		);
	}
	else echo("<br />Audio could not be saved");
}
?>
</body>
</html>