import express from "express";
import csrf from "csurf";
import url from "url";
import urljoin from "url-join";
import bcrypt from "bcryptjs";

import { hydraAdmin, db } from "./../config";

const csrfProtection = csrf({ cookie: true });
const router = express.Router();

/**
 * Find if user is registered in database
 * @param username
 * @param password
 */
const findLoggedUser: (
  username: string,
  password: string
) => Promise<boolean> = async (username, password) => {
  try {
    const userObj = db.getData(`/${username}`);
    const { password: hashedPassword } = userObj;
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
};

router.get("/", csrfProtection, (req, res, next) => {
  // Parsing the URL query
  const query = url.parse(req.url, true).query;

  const challenge = String(query.login_challenge);
  if (challenge === "undefined") {
    next(new Error("Expected a login challenge."));
    return;
  }

  // Getting the Login Request from Hydra
  hydraAdmin
    .getLoginRequest(challenge)
    .then(({ data: body }) => {
      // If hydra got the user session, we accept it and redirect back to it
      if (body.skip) {
        return hydraAdmin
          .acceptLoginRequest(challenge, {
            subject: String(body.subject),
          })
          .then(({ data: body }) => {
            res.redirect(String(body.redirect_to));
          });
      }

      // Else we render the login page
      res.render("login", {
        csrfToken: req.csrfToken(),
        challenge: challenge,
        action: urljoin(process.env.BASE_URL || "", "/login"),
        hint: body.oidc_context?.login_hint || "",
      });
    })
    .catch(next);
});

router.post("/", csrfProtection, async (req, res, next) => {
  const challenge = req.body.challenge;

  if (req.body.submit === "Deny access") {
    return hydraAdmin
      .rejectLoginRequest(challenge, {
        error: "access_denied",
        error_description: "The resource owner denied the request",
      })
      .then(({ data: body }) => {
        res.redirect(String(body.redirect_to));
      })
      .catch(next);
  }

  const isUserValid = await findLoggedUser(req.body.email, req.body.password);
  if (!isUserValid) {
    res.render("login", {
      csrfToken: req.csrfToken(),
      challenge: challenge,
      error: "Username / password doesn't exist",
    });

    return;
  }

  hydraAdmin.getLoginRequest(challenge).then(() => {
    hydraAdmin
      .acceptLoginRequest(challenge, {
        subject: req.body.email,
        remember: Boolean(req.body.remember),
        remember_for: 3600,
        acr: "0",
      })
      .then(({ data: body }) => {
        res.redirect(body.redirect_to);
      })
      .catch(next);
  });
});

export default router;
