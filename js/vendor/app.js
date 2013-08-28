(function() {
  "use strict";

  var Loader = {
    initialize: function() {
      this.el = $("#loader");
    },

    show: function() {
      //this.el.show().spin(Loader.template);
      document.getElementById('loader').style.visibility = 'visible'; 
    },

    hide: function() {
      //this.el.hide().spin(false)
      document.getElementById('loader').style.visibility = 'hidden'; 
    },

    template: {
      lines: 11,
      length: 3,
      width: 2,
      radius: 5,
      corners: 1.0,
      rotate: 0,
      trail: 60,
      speed: 2.0,
      color: "#fff"
    }
  };

  var Phonemes = {
    start: function() {
      var periodicUpdate = _.debounce(this.update, 150);

      this.$editor.on("keyup", periodicUpdate);
    },

    wrap: function(words) {
      return _.map(words, function(word){ return "<span class='word'>" + word + "</span>"; });
    },

    update: function() {
      var context = Phonemes,
          message = context.$editor.val();

      if (message.trim() == "") {
        context.$output.html("");
      } else {
        Loader.show();

        $.ajax({
          url: context.apiRoot,
          method: "POST",
          dataType: "json",
          data: { text: message }
        }).done(function(response) {
          var fragment = _.map(response, function(line) {
            return context.wrap(line).join(context.wordSeparator) + "<br>";
          });

          context.$output.html(fragment);
        }).error(function(response){
          context.$output.html("ERROR");
        }).complete(function(){
          Loader.hide();
        });
      };
    },

    initialize: function() {
      this.apiRoot = "http://api.corrasable.com/phonemes";
    //   this.apiRoot = "";
      this.$editor = $("#editor");
      this.$output = $("#output");
      this.wordSeparator = ".";

      Loader.initialize();
      Phonemes.start();
    }
  };

  $(function() { Phonemes.initialize(); });
}());
