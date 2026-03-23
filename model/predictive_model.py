import numpy as np
import pandas as pd
import torch
import torch.nn as nn

class QuantileLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, 3)  # p10, p50, p90

    def forward(self, x):
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :])


def quantile_loss(preds, target, quantiles=[0.1, 0.5, 0.9]):
    losses = []
    for i, q in enumerate(quantiles):
        errors = target - preds[:, i]
        losses.append(torch.max((q - 1) * errors, q * errors).unsqueeze(1))
    return torch.mean(torch.sum(torch.cat(losses, dim=1), dim=1))


def train_model():
    df = pd.read_csv("data/predictive_historical.csv")
    prices = df["Close"].values

    seq_len = 30
    X, y = [], []

    for i in range(len(prices) - seq_len):
        X.append(prices[i:i+seq_len])
        y.append(prices[i+seq_len])

    X = torch.tensor(np.array(X), dtype=torch.float32).unsqueeze(-1)
    y = torch.tensor(np.array(y), dtype=torch.float32)

    model = QuantileLSTM()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    for epoch in range(20):
        optimizer.zero_grad()
        preds = model(X)
        loss = quantile_loss(preds, y)
        loss.backward()
        optimizer.step()

    return model


def predict(model, last_seq, steps=252):
    seq = last_seq.copy()
    p10, p50, p90 = [], [], []

    for _ in range(steps):
        inp = torch.tensor(seq[-30:], dtype=torch.float32).unsqueeze(0).unsqueeze(-1)
        with torch.no_grad():
            pred = model(inp)[0].numpy()

        seq = np.append(seq, pred[1])  # median for continuity

        p10.append(pred[0])
        p50.append(pred[1])
        p90.append(pred[2])

    return {
        "p10": p10,
        "p50": p50,
        "p90": p90
    }