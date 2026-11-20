import urllib.request
import os

os.makedirs("checkpoints", exist_ok=True)

url = "https://dl.fbaipublicfiles.com/pyslowfast/model_zoo/kinetics400/SLOWFAST_4x16_R50.pkl"
save_path = "./checkpoints/SLOWFAST_4x16_R50.pkl"

print("Downloading... (~130MB)")
urllib.request.urlretrieve(url, save_path)
print(f"Saved → {save_path}")