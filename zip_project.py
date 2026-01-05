import os
import zipfile

def create_project_zip(output_filename):
    # 除外したいディレクトリのリスト
    exclude_dirs = {'.git', 'node_modules', '.next', '__pycache__', 'public'}
    # 除外したいファイルのリスト（環境変数やOS固有ファイル、このスクリプト自身など）
    exclude_files = {'.DS_Store', '.env.local', 'directory_tree.txt', output_filename, 'zip_project.py'}

    print(f"アーカイブを作成中: {output_filename}...")
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # カレントディレクトリから探索を開始
        for root, dirs, files in os.walk('.'):
            # 特定のディレクトリをスキップするように設定
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files:
                    continue
                
                # ファイルのフルパスを取得
                file_path = os.path.join(root, file)
                # zip内での相対パスを計算
                arcname = os.path.relpath(file_path, '.')
                
                zipf.write(file_path, arcname)
                print(f"  追加: {arcname}")

    print(f"\n完了したよ！ '{output_filename}' を確認してみてね。")

if __name__ == "__main__":
    create_project_zip('menhera_shindan_backup.zip')