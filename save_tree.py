import os
from pathlib import Path

def generate_tree(dir_path: Path, prefix: str = ""):
    """
    ディレクトリ構造を再帰的に生成するジェネレータ
    """
    # ディレクトリ内のアイテムを取得し、名前順にソート（隠しファイルを除外したい場合はここでフィルタ）
    try:
        contents = sorted([x for x in dir_path.iterdir()])
    except PermissionError:
        yield f"{prefix}Permission Denied"
        return

    # ポインタの定義
    pointers = [('├── ', '│   '), ('└── ', '    ')]

    for i, path in enumerate(contents):
        is_last = (i == len(contents) - 1)
        pointer, indent = pointers[1] if is_last else pointers[0]

        # 現在の行を出力
        yield f"{prefix}{pointer}{path.name}"

        # ディレクトリの場合は再帰的に探索
        if path.is_dir():
            yield from generate_tree(path, prefix + indent)

def save_tree_to_file(output_filename="directory_tree.txt"):
    """
    カレントディレクトリのツリーをファイルに保存
    """
    current_dir = Path.cwd()
    output_path = current_dir / output_filename
    
    print(f"処理を開始します: {current_dir}")

    try:
        with open(output_path, "w", encoding="utf-8") as f:
            # ルートディレクトリ名を書き出し
            f.write(f"{current_dir.name}/\n")
            
            # ツリー構造を書き出し
            for line in generate_tree(current_dir):
                f.write(f"{line}\n")
                
        print(f"完了しました。ファイルが保存されました: {output_path.name}")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    save_tree_to_file()