const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// نقول للـ server يقدّم الملفات من public/
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
