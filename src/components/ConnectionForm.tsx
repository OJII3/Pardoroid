import { ArrowLeft, Eye, EyeOff, KeyRound, User, Wifi } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import * as sshService from "../services/ssh";
import type { SshConfig } from "../types/ssh";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FormButton } from "./ui/form-button";
import { FormInput } from "./ui/form-input";
import { FormSelect } from "./ui/form-select";

interface ConnectionFormProps {
	onSave: (config: SshConfig) => void;
	onCancel: () => void;
	initialConfig?: Partial<SshConfig>;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
	onSave,
	onCancel,
	initialConfig = {},
}) => {
	const [config, setConfig] = useState<SshConfig>({
		host: initialConfig.host || "",
		port: initialConfig.port || 22,
		username: initialConfig.username || "",
		auth_method: initialConfig.auth_method || { Password: "" },
		timeout: initialConfig.timeout || 30,
	});

	const [showPassword, setShowPassword] = useState(false);
	const [authType, setAuthType] = useState<"password" | "publickey" | "agent">(
		typeof config.auth_method === "object"
			? "password" in config.auth_method
				? "password"
				: "publickey"
			: "agent",
	);

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isCreating, setIsCreating] = useState(false);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!config.host.trim()) {
			newErrors.host = "ホスト名を入力してください";
		}

		if (!config.username.trim()) {
			newErrors.username = "ユーザー名を入力してください";
		}

		if (config.port <= 0 || config.port > 65535) {
			newErrors.port = "ポート番号は1-65535の範囲で入力してください";
		}

		if (authType === "password" && "Password" in config.auth_method) {
			if (!config.auth_method.Password.trim()) {
				newErrors.password = "パスワードを入力してください";
			}
		}

		if (
			authType === "publickey" &&
			"PublicKey" in config.auth_method &&
			!config.auth_method.PublicKey.private_key_path.trim()
		) {
			newErrors.privateKey = "秘密鍵のパスを入力してください";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			toast.error("入力内容に不備があります");
			return;
		}

		try {
			setIsCreating(true);
			
			// Create SSH connection
			const sessionId = await sshService.createConnection(config);
			
			// Connect to the session
			await sshService.connect(sessionId);
			
			toast.success("SSH接続が正常に作成されました");
			onSave(config);
		} catch (error) {
			console.error("Failed to create SSH session:", error);
			toast.error("SSH接続の作成に失敗しました");
		} finally {
			setIsCreating(false);
		}
	};

	const updateAuthMethod = (type: "password" | "publickey" | "agent") => {
		setAuthType(type);
		setErrors({}); // Clear errors when changing auth method

		switch (type) {
			case "password":
				setConfig({ ...config, auth_method: { Password: "" } });
				break;
			case "publickey":
				setConfig({
					...config,
					auth_method: { PublicKey: { private_key_path: "", passphrase: "" } },
				});
				break;
			case "agent":
				setConfig({ ...config, auth_method: "Agent" });
				break;
		}
	};

	const updatePassword = (password: string) => {
		setConfig({ ...config, auth_method: { Password: password } });
		if (errors.password) {
			setErrors({ ...errors, password: "" });
		}
	};

	const updatePublicKey = (path: string, passphrase?: string) => {
		setConfig({
			...config,
			auth_method: {
				PublicKey: {
					private_key_path: path,
					passphrase: passphrase || "",
				},
			},
		});
		if (errors.privateKey) {
			setErrors({ ...errors, privateKey: "" });
		}
	};

	const authOptions = [
		{
			value: "password",
			label: "パスワード認証",
			icon: KeyRound,
		},
		{
			value: "publickey",
			label: "公開鍵認証",
			icon: KeyRound,
		},
		{
			value: "agent",
			label: "SSH Agent",
			icon: User,
		},
	];

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<div className="flex items-center gap-4">
					<FormButton
						icon={ArrowLeft}
						onClick={onCancel}
						size="sm"
						type="button"
						variant="ghost"
					/>
					<CardTitle className="flex items-center gap-2">
						<Wifi className="h-5 w-5" />
						SSH接続設定
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<form className="space-y-6" onSubmit={handleSubmit}>
					{/* 基本設定 */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">基本設定</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<FormInput
								containerClassName="md:col-span-2"
								error={errors.host}
								label="ホスト名 / IPアドレス"
								onChange={(e) => {
									setConfig({ ...config, host: e.target.value });
									if (errors.host) {
										setErrors({ ...errors, host: "" });
									}
								}}
								placeholder="example.com"
								required
								type="text"
								value={config.host}
							/>
							<FormInput
								error={errors.port}
								label="ポート"
								max={65535}
								min={1}
								onChange={(e) => {
									setConfig({ ...config, port: Number(e.target.value) });
									if (errors.port) {
										setErrors({ ...errors, port: "" });
									}
								}}
								placeholder="22"
								required
								type="number"
								value={config.port}
							/>
						</div>
						<FormInput
							error={errors.username}
							icon={User}
							label="ユーザー名"
							onChange={(e) => {
								setConfig({ ...config, username: e.target.value });
								if (errors.username) {
									setErrors({ ...errors, username: "" });
								}
							}}
							placeholder="username"
							required
							type="text"
							value={config.username}
						/>
						<FormInput
							description="接続がタイムアウトするまでの時間（秒）"
							label="接続タイムアウト"
							min={1}
							onChange={(e) =>
								setConfig({ ...config, timeout: Number(e.target.value) })
							}
							placeholder="30"
							type="number"
							value={config.timeout}
						/>
					</div>

					{/* 認証設定 */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">認証設定</h3>
						<FormSelect
							label="認証方式"
							onChange={updateAuthMethod}
							options={authOptions}
							size="sm"
							value={authType}
						/>

						{/* パスワード認証 */}
						{authType === "password" && (
							<div className="relative">
								<FormInput
									error={errors.password}
									label="パスワード"
									onChange={(e) => updatePassword(e.target.value)}
									placeholder="パスワードを入力"
									required
									type={showPassword ? "text" : "password"}
									value={
										"Password" in config.auth_method
											? config.auth_method.Password
											: ""
									}
								/>
								<FormButton
									className="absolute right-1 top-9 h-7 w-7"
									icon={showPassword ? EyeOff : Eye}
									onClick={() => setShowPassword(!showPassword)}
									size="sm"
									type="button"
									variant="ghost"
								/>
							</div>
						)}

						{/* 公開鍵認証 */}
						{authType === "publickey" && (
							<div className="space-y-4">
								<FormInput
									error={errors.privateKey}
									label="秘密鍵ファイルパス"
									onChange={(e) =>
										updatePublicKey(
											e.target.value,
											"PublicKey" in config.auth_method
												? config.auth_method.PublicKey.passphrase
												: "",
										)
									}
									placeholder="~/.ssh/id_rsa"
									required
									type="text"
									value={
										"PublicKey" in config.auth_method
											? config.auth_method.PublicKey.private_key_path
											: ""
									}
								/>
								<FormInput
									description="秘密鍵にパスフレーズが設定されている場合のみ入力"
									label="パスフレーズ"
									onChange={(e) =>
										updatePublicKey(
											"PublicKey" in config.auth_method
												? config.auth_method.PublicKey.private_key_path
												: "",
											e.target.value,
										)
									}
									placeholder="パスフレーズを入力"
									type="password"
									value={
										"PublicKey" in config.auth_method
											? config.auth_method.PublicKey.passphrase || ""
											: ""
									}
								/>
							</div>
						)}

						{/* SSH Agent */}
						{authType === "agent" && (
							<div className="p-4 bg-blue-50 rounded-md">
								<p className="text-sm text-blue-700">
									SSH
									Agentを使用してローカルに保存されている鍵で認証を行います。
									<br />
									事前にSSH Agentに鍵を登録しておく必要があります。
								</p>
							</div>
						)}
					</div>

					{/* 接続プレビュー */}
					<div className="p-4 bg-gray-50 rounded-md">
						<h4 className="font-medium mb-2">接続プレビュー</h4>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<span>ssh</span>
							<span>
								{config.username}@{config.host}
							</span>
							<span>-p {config.port}</span>
							<Badge variant="outline">
								{authType === "password"
									? "パスワード認証"
									: authType === "publickey"
										? "公開鍵認証"
										: "SSH Agent"}
							</Badge>
						</div>
					</div>

					{/* ボタン */}
					<div className="flex justify-end gap-2">
						<FormButton onClick={onCancel} type="button" variant="outline" disabled={isCreating}>
							キャンセル
						</FormButton>
						<FormButton type="submit" disabled={isCreating}>
							{isCreating ? "接続中..." : "接続設定を保存"}
						</FormButton>
					</div>
				</form>
			</CardContent>
		</Card>
	);
};
