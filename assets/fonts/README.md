# 字体

| 文件 | 用途 | 来源与许可 | 获取方式 |
| --- | --- | --- | --- |
| `IBMPlexSansSC-SemiBold.otf` | **字幕**（make_subtitles / final_compose 默认） | [IBM Plex](https://github.com/IBM/plex)，SIL OFL 1.1（`OFL-IBM-Plex.txt`） | 首次使用自动下载（清单 `fonts.json`），不进 git |
| `SmileySans-Oblique.ttf` | B-roll 标题（得意黑） | [Smiley Sans](https://github.com/atelier-anchor/smiley-sans)，SIL OFL 1.1 | 随仓库分发 |
| `NotoSansSC-Medium.otf` | B-roll 说明文字 | [Noto CJK](https://github.com/notofonts/noto-cjk)，SIL OFL 1.1 | 随仓库分发 |
| `InterTight-VF.ttf` | B-roll 数字与英文 | [Inter Tight](https://github.com/rsms/inter-tight)，SIL OFL 1.1 | 随仓库分发 |

三款随仓库分发的字体许可原文见 `OFL-SmileySans-NotoSansSC-InterTight.txt`。

```bash
python scripts/fetch_fonts.py --check     # 哪些字体已就绪
python scripts/fetch_fonts.py --fetch     # 预先下载字幕字体（约 7 MB/个）
python scripts/fetch_fonts.py --install <文件夹或zip>   # 网络不通时手动安装
```

`make_subtitles.py`、`final_compose.py`、`subset_fonts.py` 找不到字体时会自己下载；下载失败会报错退出，不会静默换字体。动效工程里的 `public/fonts/` 是由 `subset_fonts.py` 按实际用字生成的子集，不要拿来当字幕字体。
