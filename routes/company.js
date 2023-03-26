var express = require('express');
var router = express.Router();
var db = require("../database/setup");
const bcrypt = require("bcryptjs");
const config = require("../config/auth");
const jwt = require("jsonwebtoken");
const { authJwt } = require("../middleware");

/* GET users listing. */
router.post('/register', [authJwt.verifyNoToken],async function (req, res, next) {
  try {
    console.log(req.body);
    const user = await db.company.create({
      name: req.body.username,
      password: bcrypt.hashSync(req.body.password, 8),
      address: "",
      has_vouchers: 0
    });
    res.status(200).send('respond with a resource');
  }
  catch (e) {
    console.log(e);
    res.status(500).send('fail');
  }
});

router.post('/login', [authJwt.verifyNoToken],
async function (req, res, next) {
  try {
    const user = await db.company.findOne({
      where: {
        name: req.body.name,
      },
    });

    if (!user) {
      return res.status(404).send({message: "Company Not found."});
    }

    const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid Password!",
      });
    }

    req.session.token = jwt.sign({id: user.id}, config.company_secret, {
      expiresIn: 86400,
    });

    return res.status(200).send({
      id: user.id
    });

  } catch (error) {
    return res.status(500).send({message: error.message});
  }
});

router.post('/edit', [authJwt.verifyCompanyToken], async function (req, res, next) {
  try {
    const user = await db.company.update({
      name: req.body.username,
      password: bcrypt.hashSync(req.body.password, 8),
      address: req.body.voucher,
      has_vouchers: (req.body.voucher == 1)
    },{where:{
      id:req.body.id
    }});
    res.status(200).send('respond with a resource');
  } catch (e) {
    console.log(e);
    res.status(500).send('fail');
  }
});

router.post('/logout', [authJwt.verifyCompanyToken], function(req, res, next) {
  try {
    req.session = null;
    return res.status(200).send({
      message: "You've been signed out!"
    });
  } catch (err) {
    this.next(err);
  }
});

module.exports = router;
