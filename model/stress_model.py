import torch
import torch.nn as nn
import pandas as pd
import numpy as np

class VAE(nn.Module):
    def __init__(self, input_dim, latent_dim=3):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.ReLU(),
            nn.Linear(16, latent_dim * 2)
        )

        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 16),
            nn.ReLU(),
            nn.Linear(16, input_dim)
        )

    def forward(self, x):
        params = self.encoder(x)
        mu, logvar = params.chunk(2, dim=-1)

        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        z = mu + eps * std

        return self.decoder(z), mu, logvar


def train_vae():
    df = pd.read_csv("data/stress_test_anomalies.csv")
    df = df.select_dtypes(include='number')
    data = torch.tensor(df.values, dtype=torch.float32)

    model = VAE(input_dim=data.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    for epoch in range(50):
        optimizer.zero_grad()
        recon, mu, logvar = model(data)

        recon_loss = nn.MSELoss()(recon, data)
        kl_loss = -0.5 * torch.mean(1 + logvar - mu.pow(2) - logvar.exp())

        loss = recon_loss + kl_loss
        loss.backward()
        optimizer.step()

    return model


def generate_scenarios(model, n=5):
    scenarios = []

    for _ in range(n):
        z = torch.randn(1, 3)
        generated = model.decoder(z).detach().numpy()[0]

        scenarios.append({
            "scenarioVector": generated.tolist()
        })

    return scenarios