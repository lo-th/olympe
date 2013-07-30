/*
 * Jquery AccordionImageMenu Plugin 0.4.
 * Examples and documentation at: http://web-argument.com/jquery-accordion-image-menu-plugin
 * By Alain Gonzalez (http://web-argument.com)
 * Copyright (c) 2011 Alain Gonzalez 
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/
(function($){function accordionMenuSetting(obj,settings){this.menuSettings=settings;this.menuAnimate=animate;var _this=this;function animate(obj,i){$.each(obj,function(j){var otherDim=Math.round(((_this.menuSettings.closeDim*obj.length)-(_this.menuSettings.openDim))/(obj.length-1));var itemDim=otherDim;if(j==i){itemDim=_this.menuSettings.openDim;}
if(typeof i=='undefined'){if(_this.menuSettings.openItem==null)itemDim=_this.menuSettings.closeDim;else if(_this.menuSettings.openItem==j)itemDim=_this.menuSettings.openDim;else itemDim=otherDim;}
var title=$('span',this);title.stop(true,false);if(_this.menuSettings.fadeInTitle!=null&&title.length>0){if(itemDim==_this.menuSettings.openDim){if(_this.menuSettings.fadeInTitle)title.animate({'opacity':0.7});else title.animate({'opacity':0});}else{if(_this.menuSettings.fadeInTitle)title.animate({'opacity':0});else title.animate({'opacity':0.7});}}
if(_this.menuSettings.position=='vertical')
$(this).animate({'height':itemDim},_this.menuSettings.duration,_this.menuSettings.effect);else
$(this).animate({'width':itemDim},_this.menuSettings.duration,_this.menuSettings.effect);});}
var $this=$('a',obj);_this.menuAnimate($this);var maxDim=_this.menuSettings.closeDim*$this.length+_this.menuSettings.border*$this.length+10;if(_this.menuSettings.position=='vertical')
$(obj).css({'width':_this.menuSettings.width+'px','height':maxDim+'px'});else
$(obj).css({'height':_this.menuSettings.height+'px','width':maxDim+'px'});$.each($this,function(i){ImgSrc=$('img',this).attr('src');$('img',this).hide();var borderBottomValue=0;var borderRightValue='solid '+_this.menuSettings.border+'px '+_this.menuSettings.color;var aWidth='auto';var aHeight=_this.menuSettings.height+'px';if(_this.menuSettings.position=='vertical'){borderBottomValue='solid '+_this.menuSettings.border+'px '+_this.menuSettings.color;borderRightValue=0;aWidth=_this.menuSettings.width+'px';aHeight='auto';}
if(i==($this.length-1)){borderBottomValue=0;borderRightValue=0;}
$(this).css({'width':aWidth,'height':aHeight,'background-image':'url('+ImgSrc+')','background-color':_this.menuSettings.color,'background-repeat':'no-repeat','border-bottom':borderBottomValue,'border-right':borderRightValue}).mouseenter(function(){$this.stop(true,false);_this.menuAnimate($this,i);});});$(obj).mouseleave(function(){_this.menuAnimate($this);});}
$.fn.AccordionImageMenu=function(options){var settings={'closeDim':100,'openDim':200,'width':200,'height':200,'effect':'swing','duration':400,'openItem':null,'border':2,'color':'#000000','position':'horizontal','fadeInTitle':true};return this.each(function(){$(this).addClass("aim");$('br',this).remove();if(options)$.extend(settings,options);var menu=new accordionMenuSetting(this,settings);});};})(jQuery);