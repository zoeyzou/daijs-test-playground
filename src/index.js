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
        const promiseList = [];
        promiseList.push(price.getMkrPrice());
        promiseList.push(price.getEthPrice());
        promiseList.push(price.getPethPrice());
        promiseList.push(price.getWethToPethRatio());
        return promiseList;
      })
      .then(promises => Promise.all(promises))
      .catch(err => console.log(err));
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
      .catch(err => console.log(err));
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
        const promiseList = [];
        promiseList.push(cdp.getDebtValue(Maker.USD));
        promiseList.push(cdp.getGovernanceFee(Maker.USD));
        promiseList.push(cdp.getCollateralizationRatio());
        promiseList.push(cdp.getLiquidationPrice());
        promiseList.push(cdp.getCollateralValue(Maker.USD));
        return promiseList;
      })
      .then(promises => Promise.all(promises))
      .catch(err => console.log(err));
  },

  getEthCdpServicePromises: () => {
    return maker.authenticate()
      .then(() => maker.service('cdp'))
      .then(ethCdp => {
        const promiseList = [];
        promiseList.push(ethCdp.getLiquidationRatio());
        promiseList.push(ethCdp.getLiquidationPenalty());
        promiseList.push(ethCdp.getAnnualGovernanceFee());
        return promiseList;
      })
      .then(promises => Promise.all(promises))
      .catch(err => console.log(err));
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
      .catch(err => console.log(err));
  }
};


// Main program

Data.updateAndShowPrice();
Data.updatePricePeriodically(10000);

Dom.cdpForm.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const cdpInput = Number(Dom.cdpInput.value);
    Data.updateAndShowCdp(cdpInput);
  } catch(error) {
    Dom.errorMessage.innerHTML = 'CDP number does not exist, please try another one';
  }
})

