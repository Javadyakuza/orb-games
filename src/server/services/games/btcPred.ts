import {
  BtcPredGameParams,
  BtcPredResponse,
  BtcPredSide,
} from "@/server/models/custom/games";

// Function to get current BTC price from a free API
async function getBtcPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coinbase.com/v2/exchange-rates?currency=BTC"
    );
    const data = await response.json();
    return parseFloat(data.data.rates.USD);
  } catch (error) {
    // Fallback to another free API if Coinbase fails
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      const data = await response.json();
      return data.bitcoin.usd;
    } catch (fallbackError) {
      throw new Error("Failed to fetch BTC price from all APIs");
    }
  }
}

// Main BTC prediction game function
export async function playBtcPredGame(
  params: BtcPredGameParams
): Promise<BtcPredResponse> {
  const { watch_time_milli_secs, pred } = params;

  // Get starting price
  const start_price = await getBtcPrice();

  // Wait for the specified time
  await new Promise((resolve) => setTimeout(resolve, watch_time_milli_secs));

  // Get ending price
  const end_price = await getBtcPrice();

  // Determine if the prediction was correct
  let won = false;
  if (pred === BtcPredSide.UP && end_price > start_price) {
    won = true;
  } else if (pred === BtcPredSide.DOWN && end_price < start_price) {
    won = true;
  }

  return {
    won,
    start_price,
    end_price,
    watch_time_milli_secs,
    pred,
  };
}
