import { Peer } from "./redux/slices/rendererSlice";

export const DEFAULT_PEERS: Peer[] = [{ host: "66.97.46.144", port: 443 }];

export const knownHosts: Record<string, string> = {
  "66.97.46.144": "api.mtgatool.com",
};

export const DEFAULT_AVATAR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAACB1JREFUeF7tndlrFUsQh+u4xhiRJO5rMEbIgyiKy4sPLrihYhAUDTERjf5LcVcUUcQNBRVEiOiDuL0orqDirnFB45K4XX5z71y8uS7nzJmq6equgiEPma7urvpOTU9Pd3WupaXlO5kEa4GcARCs76OOGwBh+98ACNz/BoABYIPAoBmwMUDQ7rdBYODuNwAMAJsHCJsBGwOE7X97DQzc/waAAWDzAEEzYGOAoN1vr4GBu98AMABCmwfo3bs3DR8+nCorK6mkpCQC4MOHD/Tq1St6+PAhff78OSgovB8D9OrVi2bOnElVVVUFOfb27dvU2tpKX79+Laictpu9BWDcuHGR49OQEydO0P3799NQ5ZwO7wAYNGgQ1dXVsRh637599ObNGxbdWSn1CoBVq1ZRv379WG3Z1tZGBw4cYK1DUrkXAPTo0YPWrl0raTfatGkTff+uf0G1egDKysqovr5e1PlxZdu3b6fOzs5M6k6rUtUAlJaWUkNDQ1q2SKRn27Ztql8d1QKQy+Vo/fr1iZyWdqGNGzemrVJMn1oA4HxA4IJ8+fKFtm7d6kJTCm6DSgBmz55NY8eOLbiznAUuX75MFy5c4KyCRbc6ALp160bNzc0sxihWqcZHgToAGhsb/53DL9ZhaZfH94T9+/enrZZVnyoAXP71x17SFgVUAbB06VIaPHgw6y+iWOX4iHT69Oli1YiVVwXAhg0bxAxTTEWaooAaADDHj7l+DbJlyxY1n5HVADBr1iyqqanR4H+6dOkSXbx4UUVb1QCgJfzD658+faKdO3caAGlaQBMA6LeWcYBFgDQp/UGXAZCyYS0CpGzQf9RZBOCxqz0C0rarRYC0Lfq3PosAPHa1CJC2XS0CpG1RiwA8FiUiTQtE1DwCFixYQKNGjWJzWpqKr169SufOnUtTJZsuNQAMGDCAli1bxmaINBXv2LGDOjo60lTJpksNALCAlnGAlkkgVW8BaKzEzp9if2qPHz+mo0ePFqtGrLyqCNCnTx9avXq1mHGSVLR582b69u1bkqKZlFEFACyEBaFYGuaiaPoKGNtPHQAuRwFNC0HUAoCG420AbwUuyb179+jkyZMuNSmvtqiLAHGvXHsj0DTy/5EMtQAg109TU1NelHPfpG3g5wUA6MSwYcNo8eLF3P79rX7tWUPURoDYK5gexjRxFnLw4EF68eJFFlWnVqd6AGCJ8vJyWr58eWpGyUfR7t276f379/nc6vQ9XgAAC2Or+Lp169jnCJBHEEkhfBFvAIgdMmnSJJoyZQqLf86cOUPXr19n0Z2VUu8AiA2Z5kaSa9eu0dmzZ7PyEWu93gIQW2306NEEGJAxtBD5+PEjnTp1ivBxx2fxHoD/vPPmcjRmzBgaMWIEVVRU/DRXMGb0fEj/li+0QQGQr1FCus8ACMnbP+mrAWAAtOjPdxq4E4vpvrcRYOTIkYQ3ABwO0b9//0Q2ev36NT169IgwMPT1bcALAIYMGUKYAMLoXkKQBwgJIN69eydRHWsdagGYOHFiNOOXdbZQbALBDOGdO3dYHcWlXBUAOAxi0aJFhPTwLgrOHjpy5IiqyKACgNraWpoxY4aLPv9lm5AqTkNUcBoAfOufP3++Ksd3bSzWCbp83pCTAGDZ95o1a6h79+6qnR83HvsEcLiEiyeQOQcABndTp071wvFdO3HlyhXnMoo7BQCOfunbt6+Xzo87ha+Mu3btcqaPzgCAHT9Zv9JJeQVfG7GS2AVxAgBXjn6RdghOHstaMgcgVOfHjs8agkwBwFl/voz0k/6S8WaQ5XlDmQGADR1Dhw5NajevyuFD07FjxzLpUyYA4OPNkiVLMumwq5UeOnQok00mmQAQ+nP/VxBmMR4QBwC/fEQAk/9b4MGDB3T8+HFR04gCgCle7N4x+bUFpKOAKAArV65kP95dO1xYhSR59JwoAPbszw9PySggBsC8efOiNXomf7bAzZs3qbW19c83pnCHGAD26y/MW1JRQASAgQMHUl1dXWEWCPzuPXv2UHt7O7sVRABYsWJF4qXZ7BZwtIInT56IZBwVAcDCfzLKJB4D7ADYu38y56OUFwBMmDCBpk2bltwKAZeUWFnMHgGQ4busrCxgNybv+vPnz+nw4cPJFeRRkh0Ae/7n4YXf3ML9GDAAivMPe2kDgN3EblegGgA8+zEGMEluASwX49xQwvoIqKqqorlz5ybvvZWMNps+e/aMzRKsAPi8y4fNI10U4/g55CnkElYAsKMXO3tNklvgxo0bUf4BLmEFYM6cOVFePpPkFuCeC2AFYOHChWJpW5Kb2O2S3HsJDQC3/U9v376lvXv3srWSFYDJkycTLpPkFsDzH+MALmEFAI227V/JXcf960fL2AFAJTjbB8mdTPKzACZ+8BHo5cuX+RUo4i4RAOL2Yf//9OnTafz48UU02c+iOHX0/PnzhAWhkiIKQNeOYbFITU0NVVdXRxk9Q0kQgdyCd+/epVu3bkWZSLOUTAH4XcdLS0sJeQGxoLSysjLK769lXQHyBSJ8t7W1RRs+nz59SviFuyjOApDEWEggWVJSEl04WBJXz549owv/w4V8BIg8iDY/HkKNTF648PyNr87OTsIhUfjb0dERXXgvx19fxCsAfHGKZD8MAElrO1iXAeCgUySbZABIWtvBugwAB50i2SQDQNLaDtZlADjoFMkmGQCS1nawLgPAQadINskAkLS2g3UZAA46RbJJBoCktR2sywBw0CmSTTIAJK3tYF0GgINOkWySASBpbQfrMgAcdIpkk/4CRgaVLhQCCy8AAAAASUVORK5CYII=";

export const typeIcons: Record<string, string> = {};
typeIcons.art = "type-art";
typeIcons.cre = "type-cre";
typeIcons.enc = "type-enc";
typeIcons.ins = "type-ins";
typeIcons.lan = "type-lan";
typeIcons.pla = "type-pla";
typeIcons.sor = "type-sor";
typeIcons.bat = "type-bat";
