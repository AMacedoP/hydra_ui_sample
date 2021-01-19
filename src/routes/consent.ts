import express from "express";
import csrf from "csurf";
import url from "url";
import urljoin from "url-join";

import { hydraAdmin } from "./../config";

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

router.get("/", csrfProtection, (req, res, next) => {
  const query = url.parse(req.url, true).query;

  const challenge = String(query.consent_challenge);
  if (challenge === "undefined") {
    next(new Error("Expected a login challenge."));
    return;
  }

  hydraAdmin
    .getConsentRequest(challenge)
    .then(({ data: body }) => {
      if (body.skip) {
        return hydraAdmin
          .acceptConsentRequest(challenge, {
            grant_scope: body.requested_scope,
            grant_access_token_audience: body.requested_access_token_audience,
          })
          .then(({ data: body }) => {
            res.redirect(String(body.redirect_to));
          });
      }

      res.render("consent", {
        csrfToken: req.csrfToken(),
        challenge: challenge,
        requested_scope: body.requested_scope,
        user: body.subject,
        client: body.client,
        action: urljoin(process.env.BASE_URL || "", "/consent"),
      });
    })
    .catch(next);
});

router.post("/", csrfProtection, (req, res, next) => {
  const challenge = req.body.challenge;

  if (req.body.submit === "Deny access") {
    return hydraAdmin
      .rejectConsentRequest(challenge, {
        error: "access_denied",
        error_description: "The resource owner denied the request",
      })
      .then(({ data: body }) => {
        res.redirect(String(body.redirect_to));
      })
      .catch(next);
  }

  let grantScope = req.body.grant_scope;
  if (!Array.isArray(grantScope)) grantScope = [grantScope];

  hydraAdmin
    .getConsentRequest(challenge)
    .then(({ data: body }) => {
      return hydraAdmin
        .acceptConsentRequest(challenge, {
          grant_scope: grantScope,
          grant_access_token_audience: body.requested_access_token_audience,
          remember: Boolean(req.body.remember),
          remember_for: 3600,
        })
        .then(({ data: body }) => {
          res.redirect(String(body.redirect_to));
        });
    })
    .catch(next);
});

export default router;
