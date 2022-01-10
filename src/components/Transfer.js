import React from "react";
import { ethers } from "ethers";
import { Airdrop } from "./Airdrop";

export function Transfer({ transferTokens, claimAirdrop, claimAmount, tokenSymbol }) {
  return (
    <div>
      <h4>Transfer</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const to = formData.get("to");
          const amount = (parseInt(formData.get("amount")) * 10 ** 18).toString();

          if (to && amount) {
            transferTokens(to, amount);
          }
        }}
      >
        <div className="form-group">
          <label>Amount of {tokenSymbol}</label>
          <input
            className="form-control"
            type="number"
            step="1"
            name="amount"
            placeholder="1"
            required
          />
        </div>
        <div className="form-group">
          <label>Recipient address</label>
          <input className="form-control" type="text" name="to" required />
        </div>
        <div className="form-group" style={{padding: "10px 0px"}}>
          <input className="btn btn-primary" type="submit" value="Transfer" style={{width: "100%"}} />
        </div>
      </form>
      <Airdrop 
        claimAirdrop={claimAirdrop} 
        claimAmount={claimAmount}
      />
    </div>
  );
}
