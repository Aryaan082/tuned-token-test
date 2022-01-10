import React from "react";
import { ReactComponent as TunedLogo } from "../tuned-logo.svg";

export function Airdrop({ claimAirdrop, claimAmount }) {
  return (
    <>
      <div style={{
        textAlign: "center",
        padding: "100px 0px"
      }}>
        <TunedLogo height={"200px"} />
      </div>
      <div style={{textAlign: "center"}}>
        <button
          className="btn btn-primary"
          type="button"
          onClick={claimAirdrop}
        >Claim Tokens</button>
        <p style={{padding: "10px"}}>
          Claim <b>{claimAmount}</b> tokens.
        </p>
      </div>
    </>
  );
}
