<?php
header('Content-type: audio/mp3');
$text =  urlencode($_GET['q']);
$content= file_get_contents('http://translate.google.com/translate_tts?tl=en&q=' . $text);
echo $content;
?>