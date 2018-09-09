const maker = Maker.create('mainnet', {
  privateKey: "c2317ba204c279f9a2b0322103b391116f12009c97902991bc029f9857a3dd57"
});

const Dom = {
  loadingAnimes: document.querySelectorAll('.loading'),
  dataBlocks: document.querySelectorAll('.block-data'),
  errorMessage: document.querySelector('.error-message'),
  cdpForm: document.querySelector('form'),
  cdpInput: document.querySelector('.cdp-input'),
  dataList: document.querySelector('.data-list'),

  renderDataBlock: (prices) => {
    Dom.loadingAnimes.forEach(loader => loader.style.display = 'none');
    Dom.dataBlocks.forEach((block, i) => {
      block.style.display = "block";
      block.innerHTML = prices[i];
    });
  },

  renderDataList: (key, value) => {
    const dataSpan = document.createElement('span');
    dataSpan.classList = 'data-span';
    dataSpan.innerText = value;

    const keySpan = document.createElement('span');
    keySpan.classList = 'key-span';
    keySpan.innerText = key;

    const li = document.createElement('li');
    li.appendChild(keySpan);
    li.appendChild(dataSpan);

    Dom.dataList.appendChild(li);
  }
}

const Data = {
  prices: [],
  cdpValueObj: {},

  getPricePromises: () => {
    return maker.authenticate()
      .then(() => maker.service('price'))
      .then(price => {
        return [
          price.getMkrPrice(),
          price.getEthPrice(),
          price.getPethPrice(),
          price.getWethToPethRatio()
        ];
      })
      .then(promises => Promise.all(promises))
      .catch(err => {
        Dom.errorMessage.innerHTML = err.toString();
        return;
      });
  },

  updateAndShowPrice: () => {
    Data.getPricePromises()
      .then(res => res.map(r => r.toString()))
      .then(prices => {
        if (prices) {
          Data.prices = prices;
          Dom.renderDataBlock(prices);
        }
      })
      .catch(err => {
        Dom.errorMessage.innerHTML = err.toString();
        return;
      });
  },

  updatePricePeriodically: (interval) => {
    if (typeof interval !== 'number') {
      throw 'interval should be number'
    } else if (interval <= 0) {
      throw 'interval should be bigger than 0'
    } else {
      setInterval(() => {
        Data.updateAndShowPrice();
        console.log('interval start');
      }, interval);
    }
  },

  getCdpPromises: (cdpNo) => {
    return maker.authenticate()
      .then(() => maker.getCdp(cdpNo))
      .then(cdp => {
        return [
          cdp.getDebtValue(Maker.USD),
          cdp.getGovernanceFee(Maker.USD),
          cdp.getCollateralizationRatio(),
          cdp.getLiquidationPrice(),
          cdp.getCollateralValue(Maker.USD)
        ];
      })
      .then(promises => Promise.all(promises))
      .catch(err => {
        Dom.errorMessage.innerHTML = err.toString();
        return;
      });
  },

  getEthCdpServicePromises: () => {
    return maker.authenticate()
      .then(() => maker.service('cdp'))
      .then(ethCdp => {
        return [
          ethCdp.getLiquidationRatio(),
          ethCdp.getLiquidationPenalty(),
          ethCdp.getAnnualGovernanceFee()
        ];
      })
      .then(promises => Promise.all(promises))
      .catch(err => {
        Dom.errorMessage.innerHTML = err.toString();
        return;
      });
  },

  updateAndShowCdp: (cdpNo) => {
    Data.getCdpPromises(cdpNo)
      .then(res => {
        if (res) {
          const keys = ['Debt Value', 'Governance Fee', 'Collateralization Ratio', 'Liquidation Price', 'Collateral Value'];
          keys.forEach((key, index) => {
            Data.cdpValueObj[key] = res[index].toString();
            Dom.renderDataList(key, res[index]);
          });
        return Data.getEthCdpServicePromises();
        }

      })
      .then(res => {
        if (res) {
          const keys = ['Liquidation Ratio', 'Liquidation Penalty', 'Annual Gov. Fee'];
          keys.forEach((key, index) => {
            Data.cdpValueObj[key] = res[index].toString();
            Dom.renderDataList(key, res[index]);
          });
        }
      })
      .catch(err => {
        Dom.errorMessage.innerHTML = err.toString();
        return;
      });
  }
};


// Main program

Data.updateAndShowPrice();
Data.updatePricePeriodically(10000);

Dom.cdpForm.addEventListener('submit', event => {
  event.preventDefault();
  Dom.dataList.innerHTML = '';
  try {
    const cdpInput = Number(Dom.cdpInput.value);
    Data.updateAndShowCdp(cdpInput);
  } catch(error) {
    Dom.errorMessage.innerHTML = error.toString();
  }
})

