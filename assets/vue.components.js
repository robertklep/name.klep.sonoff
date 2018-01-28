Vue.component('editable', {
  template : '<div contenteditable="true" @keydown="onKeydown" @input="onInput"></div>',
  props    : [ 'content' ],
  mounted  : function() {
    this.$el.innerText = this.content;
  },
  methods : {
    onKeydown : function(ev) {
      if ([ 9, 13, 27 ].includes(ev.keyCode)) {
        ev.preventDefault();
        ev.target.blur();
      }
    },
    onInput : function(ev) {
      this.$emit('update', ev.target.innerText.trim());
    }
  }
});
