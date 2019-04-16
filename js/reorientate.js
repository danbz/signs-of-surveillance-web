function reOrientateImage(imageName, orientation) {
  // function to re-orientate canvas object depending upon EXIF camera orientation number
  // receives name of image (assumed to be JPG) and orientation_
  // returns array to context of named canvas object and position of canvas draw elements

  console.log("orientation " + orientation + " imagename " + imageName);
  var c = document.getElementById(imageName + "_canvas");
  var ctx = c.getContext("2d");
  //var img = document.getElementById(imageName);
  var img = new Image();
  img.src = imageName + ".jpg";
  canvas.width = img.width;
  canvas.height = img.height;
  var x = 0;
  var y = 0;
  //  ctx.save();
  // x = -canvas.width;
  // y = -canvas.height;
  ctx.save();
  if (orientation == 1) {

    ctx.scale(1, 1);
    console.log("scaled 1");
  } else
  if (orientation == 2) {
    x = -canvas.width;
    ctx.scale(-1, 1);
    console.log("scaled 2");

  } else if (orientation == 3) {
    x = -canvas.width;
    y = -canvas.height;
    ctx.scale(-1, -1);
    console.log("scaled 3");

  } else if (orientation == 4) {
    y = -canvas.height;
    ctx.scale(1, -1);
    console.log("scaled 4");

  } else if (orientation == 5) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    y = -canvas.width;
    ctx.scale(1, -1);
    console.log("scaled 5");

  } else if (orientation == 6) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    console.log("scaled 6");

  } else if (orientation == 7) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    x = -canvas.height;
    ctx.scale(-1, 1);
    console.log("scaled 7");

  } else if (orientation == 8) {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width, canvas.height / canvas.width);
    ctx.rotate(Math.PI / 2);
    x = -canvas.height;
    y = -canvas.width;
    ctx.scale(-1, -1);
    console.log("scaled  8");
  }
  return [ctx, x, y];
  //  ctx.drawImage(img, x, y);
  //ctx.restore();

}
