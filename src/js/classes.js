Point = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}
Point.prototype.constructor = Point;
Point.prototype = {
  clone: function() {
    return new Point(this.x, this.y);
  },
  add: function() {
    var o = {};
    if (arguments.length === 1) {
      o = arguments[0];
    }
    else if (arguments.length === 2) {
      o.x = arguments[0];
      o.y = arguments[1];
    }
    else {
      throw new Error('err arguments number!')
    }
    p = this.clone();
    p.x += o.x;
    p.y += o.y;
    return p;
  },
  sub: function() {
    var o = {};
    if (arguments.length === 1) {
      o = arguments[0];
    }
    else if (arguments.length === 2) {
      o.x = arguments[0];
      o.y = arguments[1];
    }
    else {
      throw new Error('err arguments number!')
    }
    p = this.clone();
    p.x -= o.x;
    p.y -= o.y;
    return p;
  },
  div: function(n) {
    p = this.clone();
    p.x /= n;
    p.y /= n;
    return p;
  },
  mul: function(n) {
    p = this.clone();
    p.x *= n;
    p.y *= n;
    return p;
  }
}