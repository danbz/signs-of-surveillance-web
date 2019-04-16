function getImageFileNames() {
  // request filenames of images from php file on server
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
    //  document.getElementById("txtHint").innerHTML = this.responseText;
      console.log ("returned server filenames " + this.responseText);
      myFileNames = JSON.parse(this.responseText);
      addSigns();
    
    }
  };
  xmlhttp.open("GET", "getNumofFiles.php", true);
  xmlhttp.send();
}
