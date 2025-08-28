/* Scene Heading */
Macro.add("scene", {
  handler() {
    const text = this.args.join(" ");
    $(this.output).wiki('<span class="scene">' + text + '</span>');
  }
});

/* Action line */
Macro.add("action", {
  handler() {
    const text = this.args.join(" ");
    $(this.output).wiki('<span class="action">' + text + '</span>');
  }
});

/* Character name */
Macro.add("char", {
  handler() {
    const text = this.args.join(" ");
    $(this.output).wiki('<span class="char">' + text + '</span>');
  }
});

/* Dialogue */
Macro.add("dialogue", {
  handler() {
    const text = this.args.join(" ");
    $(this.output).wiki('<span class="dialogue">' + text + '</span>');
  }
});

/* Parenthetical */
Macro.add("paren", {
  handler() {
    const text = this.args.join(" ");
    $(this.output).wiki('<span class="parenthetical">' + text + '</span>');
  }
});

